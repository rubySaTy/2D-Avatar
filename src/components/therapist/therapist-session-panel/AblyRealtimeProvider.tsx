"use client";

import { AblyProvider, ChannelProvider } from "ably/react";
import TherapistInteractionPanel from "./TherapistInteractionPanel";
import { ablyRealtime } from "@/lib/integrations/ably/ably-client";
import type { MicrosoftVoice } from "@/lib/types";

interface AblyRealtimeProviderProps {
  meetingLink: string;
  meetingCipherKey: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
    ageGroups: string[];
  };
}

export default function AblyRealtimeProvider({
  VoiceSelectorProps,
  meetingLink,
  meetingCipherKey,
}: AblyRealtimeProviderProps) {
  const client = ablyRealtime;
  const cipherKey = Buffer.from(meetingCipherKey, "base64");

  return (
    <AblyProvider client={client}>
      <ChannelProvider
        channelName={`meeting:${meetingLink}`}
        options={{ cipher: { key: cipherKey } }}
      >
        <TherapistInteractionPanel
          meetingLink={meetingLink}
          VoiceSelectorProps={VoiceSelectorProps}
        />
      </ChannelProvider>
    </AblyProvider>
  );
}
