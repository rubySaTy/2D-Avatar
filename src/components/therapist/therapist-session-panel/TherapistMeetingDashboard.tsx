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

const AblyConnection = dynamic(
  () => import("@/components/therapist/therapist-session-panel/AblyConnection"),
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
      />
      <AblyConnection
        meetingLink={meetingLink}
        meetingCipherKey={meetingCipherKey}
        VoiceSelectorProps={VoiceSelectorProps}
      />
    </>
  );
}
