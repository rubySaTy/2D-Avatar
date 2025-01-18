"use client";

import dynamic from "next/dynamic";
import TherapistPanelHeader from "./TherapistPanelHeader";
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
    <>
      <TherapistPanelHeader
        avatarImageUrl={avatarImageUrl}
        avatarName={avatarName}
        clientUrl={clientUrl}
        meetingLink={meetingLink}
      />
      <AblyRealtimeProvider meetingLink={meetingLink} meetingCipherKey={meetingCipherKey}>
        <TherapistInteractionPanel
          therapistUsername={therapistUsername}
          meetingLink={meetingLink}
          voiceList={voiceList}
        />
      </AblyRealtimeProvider>
    </>
  );
}
