"use server";

import axios, { AxiosError } from "axios";
import { db } from "@/lib/db/db";
import {
  shortUUID,
  getAvatarByMeetingLink,
  getMeetingDataByLink,
} from "@/lib/utils.server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { meetingSessions } from "@/lib/db/schema";
import { createTalkStreamSchema } from "@/lib/validationSchema";
import type { Avatar, NewMeetingSession } from "@/lib/db/schema";
import type { ProviderConfig } from "@/lib/types";

export async function createSession(prevState: any, formData: FormData) {
  const avatarJson = formData.get("avatar")?.toString();
  if (!avatarJson) {
    return { message: "Invalid avatar" };
  }

  const avatar: Avatar = JSON.parse(avatarJson);
  const user = await getUser();
  if (!user) {
    return { message: "Invalid credentials" };
  }

  const meetingLink = shortUUID();
  try {
    const newMeetingSession: NewMeetingSession = {
      userId: user.id,
      avatarId: avatar.id,
      meetingLink,
    };

    await db.insert(meetingSessions).values(newMeetingSession);
  } catch (error) {
    console.error(error);
    return { message: "Error creating session" };
  }

  redirect(`/therapist/${meetingLink}`);
}

export async function sendICECandidate(
  streamId: string,
  sessionId: string,
  candidate: RTCIceCandidateInit
) {
  try {
    axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}/ice`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          session_id: sessionId,
        },
      }
    );
  } catch (error) {
    console.error("Error in 'sendICECandidate'");
    console.error(error);
  }
}

export async function notifyICEGatheringComplete(
  sessionId: string,
  streamId: string
) {
  try {
    axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}/ice`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { session_id: sessionId },
      }
    );
  } catch (error) {
    console.error("Error in 'notifyICEGatheringComplete'");
    console.error(error);
  }
}

export async function sendSdpAnswer(
  streamId: string,
  answer: RTCSessionDescriptionInit,
  sessionId: string
) {
  try {
    await axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}/sdp`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { answer, session_id: sessionId },
      }
    );
  } catch (error) {
    console.error("Error in 'sendSdpAnswer'");
    console.error(error);
  }
}

export async function closeStream(streamId: string, sessionId: string) {
  try {
    await axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { session_id: sessionId },
      }
    );
  } catch (error) {
    console.error("Error in 'closeStream'");
    console.error(error);
  }
}

export async function createTalkStream(
  meetingLink: string,
  formData: FormData
) {
  const ParsedData = createTalkStreamSchema.safeParse({
    meetingLink,
    message: formData.get("message"),
    providerType: formData.get("providerType"),
    voiceId: formData.get("voiceId"),
    voiceStyle: formData.get("voiceStyle"),
  });

  if (!ParsedData.success) {
    const errors = ParsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { message, providerType, voiceId, voiceStyle } = ParsedData.data;

  const meetingData = await getMeetingDataByLink(meetingLink);
  if (!meetingData) {
    console.error(`Meeting data not found with meeting link ${meetingLink}`);
    return { success: false, message: "Meeting data not found" };
  }
  const { avatar, session } = meetingData;

  const voiceProvider: ProviderConfig = {
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
    await axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${session.didStreamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
          "x-api-key-external": JSON.stringify({
            elevenlabs: process.env.ELEVENLABS_API_KEY,
          }),
        },
        data: {
          script: {
            type: "text",
            provider: voiceProvider,
            ssml: "false",
            input: message,
          },
          config: { fluent: true, pad_audio: "0.0" },
          session_id: session.didSessionId,
        },
      }
    );

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

interface SessionResponse {
  id: string;
  offer: RTCSessionDescriptionInit;
  ice_servers: RTCIceServer[];
  session_id: string;
}

// Initialize D-ID stream
export async function createDIDStream(meetingLink: string) {
  if (!meetingLink) return null;

  const avatar = await getAvatarByMeetingLink(meetingLink);
  if (!avatar) return null;

  try {
    const sessionResponse = await axios<SessionResponse>({
      url: `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams`,
      method: "POST",
      data: { source_url: avatar.imageUrl, stream_warmup: true },
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!sessionResponse.data) return null;

    await db
      .update(meetingSessions)
      .set({
        didStreamId: sessionResponse.data.id,
        didSessionId: sessionResponse.data.session_id,
        offer: sessionResponse.data.offer,
        iceServers: sessionResponse.data.ice_servers,
      })
      .where(eq(meetingSessions.meetingLink, meetingLink));
    console.log(`DB updated successfully at meeting link ${meetingLink}`);

    return sessionResponse.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
