import "server-only";

import { db } from "@/lib/db/db";
import { meetingSessions, type NewMeetingSession } from "@/lib/db/schema";
import { Rest } from "ably";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/integrations/redis";
import type { DIDCreateWebRTCStreamResponse, WebRTCStreamDataRedis } from "@/lib/types";

const STREAM_TTL = 60 * 60;

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

export async function storeWebRTCSession(
  webRTCData: DIDCreateWebRTCStreamResponse,
  meetingLink: string
) {
  const sessionKey = `webrtc:session:${meetingLink}`;

  const sessionData: WebRTCStreamDataRedis = {
    didStreamId: webRTCData.id,
    didSessionId: webRTCData.session_id,
    offer: webRTCData.offer,
    iceServers: webRTCData.ice_servers,
    status: "pending", // Initial status
  };

  // Upstash Redis transaction
  await redis
    .pipeline()
    .hset(sessionKey, sessionData)
    .expire(sessionKey, STREAM_TTL)
    .exec();

  return sessionData;
}

export async function updateStreamStatus(
  meetingLink: string,
  status: WebRTCStreamDataRedis["status"]
) {
  const streamKey = `webrtc:session:${meetingLink}`;

  // Update just the status fields
  await redis.hset(streamKey, { status });

  // Refresh TTL on status update
  await redis.expire(streamKey, STREAM_TTL);
}

export async function getWebRTCSession(meetingLink: string) {
  const sessionKey = `webrtc:session:${meetingLink}`;
  const data = await redis.hgetall<WebRTCStreamDataRedis>(sessionKey);
  if (!data) return null;

  return {
    didStreamId: data.didStreamId,
    didSessionId: data.didSessionId,
    offer: data.offer,
    iceServers: data.iceServers,
    status: data.status,
  };
}

export async function getWebRTCStatus(meetingLink: string) {
  const sessionKey = `webrtc:session:${meetingLink}`;
  return redis.hget<string>(sessionKey, "status");
}

export async function deleteWebRTCSession(meetingLink: string) {
  const sessionKey = `webrtc:session:${meetingLink}`;
  await redis.del(sessionKey); // is ignored if key doesn't exist, no error thrown
}
