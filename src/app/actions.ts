"use server";

import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { openAI } from "@/lib/integrations/openai";
import { ablyRest } from "@/lib/integrations/ably/ably-server";
import { createNewMeetingSession, getMeetingSessionCipherKey } from "@/services";
import { avatarIdSchema } from "@/lib/validationSchema";

export async function createSession(prevState: any, formData: FormData) {
  const res = avatarIdSchema.safeParse(formData.get("avatar-id"));
  if (!res.success) return { success: false, message: res.error.message };
  const avatarId = res.data;

  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "unauthorized" };

  let meetingLink: string | null = null;
  try {
    meetingLink = await createNewMeetingSession(currentUser.id, avatarId);
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating session" };
  }

  redirect(`/therapist/${meetingLink}`);
}

export async function transcribeAndBroadcast(audioFile: File, meetingLink: string) {
  if (!meetingLink || !audioFile) return;

  try {
    const cipherKey = await getMeetingSessionCipherKey(meetingLink);
    if (!cipherKey) {
      console.error("Cipher key not found for meeting link:", meetingLink);
      return;
    }

    const transcribe = await openAI.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    await ablyRest.channels
      .get(`meeting:${meetingLink}`, { cipher: { key: cipherKey } })
      .publish("transcript", { transcribedText: transcribe.text });
  } catch (error) {
    console.error(error);
  }
}

export async function transcribe(audioFile: File) {
  if (!audioFile) return;
  try {
    const transcribe = await openAI.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return transcribe.text;
  } catch (error) {
    console.error(error);
  }
}

export async function logMessage(message: string) {
  console.log(message);
}
