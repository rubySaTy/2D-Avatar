"use server";

import didApi from "@/lib/d-idApi";
import { AxiosError } from "axios";
import { createTalkStreamSchema } from "@/lib/validationSchema";
import type { VoiceProviderConfig } from "@/lib/types";
import {
  createTalkStream,
  createWebRTCStream,
  getAvatarByMeetingLink,
  getMeetingSessionWithAvatar,
} from "@/services";
import { meetingSessions, type NewTalk, talks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/db";

export async function sendICECandidate(
  streamId: string,
  sessionId: string,
  eventCandidate: RTCIceCandidateInit
) {
  const { candidate, sdpMid, sdpMLineIndex } = eventCandidate;
  try {
    didApi.post(`/streams/${streamId}/ice`, {
      candidate,
      sdpMid,
      sdpMLineIndex,
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Error in 'sendICECandidate'", error);
  }
}

export async function notifyICEGatheringComplete(
  sessionId: string,
  streamId: string
) {
  try {
    didApi.post(`/streams/${streamId}/ice`, { session_id: sessionId });
  } catch (error) {
    console.error("Error in 'notifyICEGatheringComplete'", error);
  }
}

export async function sendSDPAnswer(
  streamId: string,
  answer: RTCSessionDescriptionInit,
  sessionId: string
) {
  try {
    await didApi.post(`/streams/${streamId}/sdp`, {
      answer,
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Error in 'sendSDPAnswer'", error);
  }
}

export async function closeStream(streamId: string, sessionId: string) {
  try {
    await didApi.delete(`/streams/${streamId}`),
      {
        session_id: sessionId,
      };
  } catch (error) {
    console.error("Error in 'closeStream'", error);
  }
}

export async function submitMessageToDID(
  meetingLink: string,
  formData: FormData
) {
  const parsedData = createTalkStreamSchema.safeParse({
    meetingLink,
    message: formData.get("message"),
    premadeMessage: formData.get("premadeMessage"),
    providerType: formData.get("providerType"),
    voiceId: formData.get("voiceId"),
    voiceStyle: formData.get("voiceStyle"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const {
    message: userMessage,
    premadeMessage,
    providerType,
    voiceId,
    voiceStyle,
  } = parsedData.data;
  const message = premadeMessage ?? userMessage;

  const meetingData = await getMeetingSessionWithAvatar(meetingLink);
  if (!meetingData) {
    console.error(`Meeting data not found with meeting link ${meetingLink}`);
    return { success: false, message: "Meeting data not found" };
  }
  const {
    didStreamId,
    didSessionId,
    id: meetingSessionId,
    avatar,
  } = meetingData;

  if (!didStreamId || !didSessionId) {
    return { success: false, message: `D-ID stream or session not found` };
  }

  const voiceProvider: VoiceProviderConfig = {
    type: providerType || "microsoft", // Default to 'microsoft' if undefined
    voice_id: voiceId || "en-US-EmmaMultilingualNeural", // Default voice ID
    voice_config: voiceStyle ? { style: voiceStyle } : {},
  };

  // Override with avatar's ElevenLabs voice ID if available and no voice ID is provided
  if (avatar.elevenlabsVoiceId && !voiceId) {
    voiceProvider.type = "elevenlabs";
    voiceProvider.voice_id = avatar.elevenlabsVoiceId;
  }

  try {
    const newTalkStream = await createTalkStream(
      didStreamId,
      didSessionId,
      voiceProvider,
      message
    );

    const newTalk: NewTalk = { id: newTalkStream.video_id, meetingSessionId };
    await db.insert(talks).values(newTalk);

    return { success: true, message: message };
  } catch (error) {
    console.error("Error in 'createTalkStream'");
    if (error instanceof AxiosError) {
      console.error("D-ID API error:", {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    } else console.error("Non-Axios error:", error);

    return { success: false, message: "Failed to send message to avatar" };
  }
}

export async function createDIDStream(meetingLink: string) {
  if (!meetingLink) return null;

  const avatar = await getAvatarByMeetingLink(meetingLink);
  if (!avatar) return null;

  const didWebRTCStreamData = await createWebRTCStream(avatar.imageUrl);
  if (!didWebRTCStreamData) return null;

  try {
    await db
      .update(meetingSessions)
      .set({
        didStreamId: didWebRTCStreamData.id,
        didSessionId: didWebRTCStreamData.session_id,
        offer: didWebRTCStreamData.offer,
        iceServers: didWebRTCStreamData.ice_servers,
      })
      .where(eq(meetingSessions.meetingLink, meetingLink));

    return didWebRTCStreamData;
  } catch (error) {
    console.error(error);
    return null;
  }
}
