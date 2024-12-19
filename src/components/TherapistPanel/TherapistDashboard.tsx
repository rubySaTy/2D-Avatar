"use client";

import dynamic from "next/dynamic";
import TherapistPanelHeader from "./TherapistPanelHeader";
import type { MicrosoftVoice } from "@/lib/types";

interface TherapistDashboardProps {
  avatarImageUrl: string;
  avatarName: string;
  clientUrl: string;
  meetingLink: string;
  meetingCipherKey: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
  };
}

const AblyConnection = dynamic(
  () => import("@/components/TherapistPanel/AblyConnection"),
  { ssr: false }
);

export default function TherapistDashboard({
  avatarName,
  avatarImageUrl,
  clientUrl,
  meetingLink,
  meetingCipherKey,
  VoiceSelectorProps,
}: TherapistDashboardProps) {
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
