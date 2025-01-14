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
