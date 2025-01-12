"use client";

import dynamic from "next/dynamic";
import TherapistPanelHeader from "./TherapistPanelHeader";
import type { MicrosoftVoice } from "@/lib/types";

interface TherapistMeetingDashboardProps {
  avatarImageUrl: string;
  avatarName: string;
  clientUrl: string;
  meetingLink: string;
  meetingCipherKey: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
    ageGroups: string[];
  };
}

const AblyRealtimeProvider = dynamic(
  () => import("@/components/therapist/therapist-session-panel/AblyRealtimeProvider"),
  { ssr: false }
);

export default function TherapistMeetingDashboard({
  avatarName,
  avatarImageUrl,
  clientUrl,
  meetingLink,
  meetingCipherKey,
  VoiceSelectorProps,
}: TherapistMeetingDashboardProps) {
  return (
    <>
      <TherapistPanelHeader
        avatarImageUrl={avatarImageUrl}
        avatarName={avatarName}
        clientUrl={clientUrl}
        meetingLink={meetingLink}
      />
      <AblyRealtimeProvider
        meetingLink={meetingLink}
        meetingCipherKey={meetingCipherKey}
        VoiceSelectorProps={VoiceSelectorProps}
      />
    </>
  );
}
