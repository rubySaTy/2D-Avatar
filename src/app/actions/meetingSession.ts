"use server";

import { ablyRest } from "@/lib/integrations/ably/ably-server";
import { getWebrtcConnectionStatus, updateWebrtcConnectionStatus } from "@/services";

export async function publishWebRTCStatusAction(
  meetingLink: string,
  isConnected: boolean
) {
  try {
    console.log(
      `publishing webrtc status to redis and ably in Meeting Link: ${meetingLink} \nconnection status: ${isConnected}`
    );
    updateWebrtcConnectionStatus(meetingLink, isConnected);
    await ablyRest.channels
      .get(`meeting:${meetingLink}`)
      .publish("webrtc-status", { isConnected });
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
