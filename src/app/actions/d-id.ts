"use server";

import didApi from "@/lib/d-idApi";
import { AxiosError } from "axios";
import { createTalkStreamSchema } from "@/lib/validationSchema";
import {
  getMeetingSession,
  createTalkInDb,
  removeCredits,
  updateMeetingSessionWithWebRTCData,
} from "@/services";
import type { NewTalk } from "@/lib/db/schema";
import type {
  DIDCreateTalkStreamResponse,
  DIDCreateWebRTCStreamResponse,
  VoiceProviderConfig,
} from "@/lib/types";

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

export async function notifyICEGatheringComplete(sessionId: string, streamId: string) {
  try {
    didApi.post(`/streams/${streamId}/ice`, { session_id: sessionId });
  } catch (error) {
    console.error("Error in 'notifyICEGatheringComplete'", error);
  }
}

export async function sendSDPAnswer(
  streamId: string,
  sessionId: string,
  answer: RTCSessionDescriptionInit
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

export async function submitMessageToDID(prevState: any, formData: FormData) {
  const parsedData = createTalkStreamSchema.safeParse({
    meetingLink: formData.get("meetingLink"),
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
    meetingLink,
    message: userMessage,
    premadeMessage,
    providerType,
    voiceId,
    voiceStyle,
  } = parsedData.data;
  const message = premadeMessage ?? userMessage;

  const meetingData = await getMeetingSession(meetingLink);
  if (!meetingData) {
    console.error(`Meeting data not found with meeting link ${meetingLink}`);
    return { success: false, message: "Meeting data not found" };
  }
  const {
    id: meetingSessionId,
    userId,
    user,
    didStreamId,
    didSessionId,
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
  if (avatar.elevenlabsClonedVoiceId && !voiceId) {
    voiceProvider.type = "elevenlabs";
    voiceProvider.voice_id = avatar.elevenlabsClonedVoiceId;
  }

  try {
    const res = await didApi.post<DIDCreateTalkStreamResponse>(
      `/streams/${didStreamId}`,
      {
        script: {
          type: "text",
          provider: voiceProvider,
          ssml: "false",
          input: message,
        },
        config: { fluent: true, pad_audio: "0.0" },
        session_id: didSessionId,
      },
      {
        headers: {
          "x-api-key-external": JSON.stringify({
            elevenlabs: process.env.ELEVENLABS_API_KEY,
          }),
        },
      }
    );

    const newTalkStream = res.data;

    if (user.role !== "admin") {
      await removeCredits(userId, 0.5, "Created a talk/stream");
    }

    const newTalk: NewTalk = { id: newTalkStream.video_id, meetingSessionId };
    await createTalkInDb(newTalk);

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

export async function createDIDStream(meetingLink: string, DIDCodec: string) {
  if (!meetingLink) return null;

  try {
    const meetingSessionData = await getMeetingSession(meetingLink);
    if (!meetingSessionData) return null;

    const { avatar } = meetingSessionData;

    const sessionResponse = await didApi.post<DIDCreateWebRTCStreamResponse>("/streams", {
      source_url: avatar.imageUrl,
      stream_warmup: true,
      compatibility_mode: DIDCodec, // "on" => VP8 - everything | "off" => H.264 - iOS/Safari (even chrome on iOS)
    });

    const didWebRTCStreamData = sessionResponse.data;

    await updateMeetingSessionWithWebRTCData(didWebRTCStreamData, meetingLink);
    return didWebRTCStreamData;
  } catch (error) {
    console.error(error);
    return null;
  }
}
