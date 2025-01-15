"use server";

import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { ablyRest } from "@/lib/integrations/ably/ably-server";
import { avatarIdSchema } from "@/lib/validationSchema";
import {
  createNewMeetingSession,
  getAvatarWithAssociatedUsersId,
  getMeetingSessionCipherKey,
  getWebrtcConnectionStatus,
  updateWebrtcConnectionStatus,
} from "@/services";
import { openAI } from "@/lib/integrations/openai";

export async function createSessionAction(_: any, formData: FormData) {
  const { user } = await validateRequest();
  if (!user) return { success: false, message: "unauthorized" };

  const res = avatarIdSchema.safeParse(formData.get("avatar-id"));
  if (!res.success) return { success: false, message: res.error.message };
  const avatarId = res.data;

  let meetingLink: string | null = null;
  try {
    const avatar = await getAvatarWithAssociatedUsersId(avatarId);
    if (!avatar || !avatar.idleVideoUrl)
      return {
        success: false,
        message: "No idle video available, please wait a few moments and try again",
      };

    if (!avatar.isPublic && !avatar.associatedUsersId.includes(user.id))
      return { success: false, message: "Unauthorized" };

    meetingLink = await createNewMeetingSession(user.id, avatarId);
  } catch (error) {
    console.error("Error creating a new meeting session", error);
    return { success: false, message: "Error creating session" };
  }

  redirect(`/therapist/${meetingLink}`);
}

export async function publishWebRTCStatusAction(
  meetingLink: string,
  isConnected: boolean
) {
  console.log(
    `publishing webrtc status to redis and ably in Meeting Link: ${meetingLink} \nconnection status: ${isConnected}`
  );
  try {
    await Promise.all([
      updateWebrtcConnectionStatus(meetingLink, isConnected),
      ablyRest.channels
        .get(`meeting:${meetingLink}`)
        .publish("webrtc-status", { isConnected }),
    ]);
  } catch (error) {
    console.error("failed to publish webrtc status to ably", error);
  }
}

export async function getMeetingStatusAction(meetingLink: string) {
  try {
    return getWebrtcConnectionStatus(meetingLink);
  } catch (error) {
    console.error("failed to get webrtc status from redis", error);
    return null;
  }
}

export async function publishStreamStartedAction(meetingLink: string) {
  try {
    console.log(`publishing stream/started to ably in Meeting Link: ${meetingLink}`);
    await ablyRest.channels.get(`meeting:${meetingLink}`).publish("stream/started", {});
  } catch (error) {
    console.error("failed to publish stream done to ably", error);
  }
}

export async function publishStreamDoneAction(meetingLink: string) {
  try {
    console.log(`publishing stream/done to ably in Meeting Link: ${meetingLink}`);
    await ablyRest.channels.get(`meeting:${meetingLink}`).publish("stream/done", {});
  } catch (error) {
    console.error("failed to publish stream done to ably", error);
  }
}

export async function transcribeAndBroadcastAction(audioFile: File, meetingLink: string) {
  if (!meetingLink || !audioFile) return;

  try {
    const cipherKey = await getMeetingSessionCipherKey(meetingLink);
    if (!cipherKey) {
      console.error("Cipher key not found for meeting link:", meetingLink);
      return;
    }

    console.log(`Transcribing audio for meeting link: ${meetingLink}`);
    const transcribe = await openAI.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    await ablyRest.channels
      .get(`meeting:${meetingLink}`, { cipher: { key: cipherKey } })
      .publish("transcript", { transcribedText: transcribe.text });
  } catch (error) {
    console.error("Error transcribing and broadcasting audio", error);
  }
}
