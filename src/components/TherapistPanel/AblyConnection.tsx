"use client";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import TherapistInteractionPanel from "./TherapistInteractionPanel";
import type { MicrosoftVoice } from "@/lib/types";

interface AblyConnectionProps {
  meetingLink: string;
  meetingCipherKey: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
  };
}

export default function AblyConnection({
  VoiceSelectorProps,
  meetingLink,
  meetingCipherKey,
}: AblyConnectionProps) {
  const client = new Ably.Realtime({ authUrl: "../api/ably" });
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
