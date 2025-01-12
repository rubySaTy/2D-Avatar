"use server";

import { updateStreamStatus } from "@/services";

export async function updateWebRTCStreamStatusAction(
  meetingLink: string,
  isConnected: boolean
) {
  try {
    const status = isConnected ? "connected" : "pending";
    await updateStreamStatus(meetingLink, status);
  } catch (error) {
    console.error("Failed to update stream status:", error);
  }
}
