import "server-only";

import { db } from "@/lib/db/db";
import { meetingSessions, type NewMeetingSession } from "@/lib/db/schema";
import { Rest } from "ably";
import { eq } from "drizzle-orm";
import type { DIDCreateWebRTCStreamResponse } from "@/lib/types";

export async function createNewMeetingSession(userId: string, avatarId: number) {
  const meetingLink = generateMeetingSessionLink();
  const cipherKey = await Rest.Crypto.generateRandomKey();
  const newMeetingSession: NewMeetingSession = {
    userId,
    avatarId,
    meetingLink,
    cipherKey,
  };

  await db.insert(meetingSessions).values(newMeetingSession);
  return meetingLink;
}

export async function getMeetingSessionCipherKey(meetingLink: string) {
  const result = await db.query.meetingSessions.findFirst({
    where: eq(meetingSessions.meetingLink, meetingLink),
    columns: { cipherKey: true },
  });

  return result?.cipherKey ?? null;
}

export async function getMeetingSession(meetingLink: string) {
  const result = await db.query.meetingSessions.findFirst({
    where: eq(meetingSessions.meetingLink, meetingLink),
    with: {
      avatar: true,
      user: { columns: { role: true } },
    },
  });

  return result ?? null;
}

function generateMeetingSessionLink() {
  const uuid: string = crypto.randomUUID();

  // Remove dashes and convert to a Uint8Array
  const byteArray: Uint8Array = new Uint8Array(16);
  const hexWithoutDashes: string = uuid.replace(/[-]/g, "");

  const matches = hexWithoutDashes.match(/.{1,2}/g);
  if (matches) {
    matches.forEach((byte, i) => {
      byteArray[i] = parseInt(byte, 16);
    });
  }

  // Convert Uint8Array to a regular array and then to base64
  const base64: string = btoa(String.fromCharCode.apply(null, Array.from(byteArray)));
  return base64
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .substring(0, 10);
}

export async function updateMeetingSessionWithWebRTCData(
  webRTCData: DIDCreateWebRTCStreamResponse,
  meetingLink: string
) {
  await db
    .update(meetingSessions)
    .set({
      didStreamId: webRTCData.id,
      didSessionId: webRTCData.session_id,
      offer: webRTCData.offer,
      iceServers: webRTCData.ice_servers,
    })
    .where(eq(meetingSessions.meetingLink, meetingLink));
}
