"use client";

import dynamic from "next/dynamic";
import TherapistInteractionPanel from "./TherapistInteractionPanel";
import type { VoiceList } from "@/lib/types";

interface TherapistMeetingDashboardProps {
  therapistUsername: string;
  avatarImageUrl: string;
  avatarName: string;
  clientUrl: string;
  meetingLink: string;
  meetingCipherKey: string;
  voiceList: VoiceList;
}

const AblyRealtimeProvider = dynamic(
  () => import("@/components/therapist/therapist-session-panel/AblyRealtimeProvider"),
  { ssr: false }
);

export default function TherapistMeetingDashboard({
  therapistUsername,
  avatarName,
  avatarImageUrl,
  clientUrl,
  meetingLink,
  meetingCipherKey,
  voiceList,
}: TherapistMeetingDashboardProps) {
  return (
    <AblyRealtimeProvider meetingLink={meetingLink} meetingCipherKey={meetingCipherKey}>
      <TherapistInteractionPanel
        therapistUsername={therapistUsername}
        avatarName={avatarName}
        avatarImageUrl={avatarImageUrl}
        clientUrl={clientUrl}
        meetingLink={meetingLink}
        voiceList={voiceList}
      />
    </AblyRealtimeProvider>
  );
}
