import { AblyProvider, ChannelProvider } from "ably/react";
import { ablyRealtime } from "@/lib/integrations/ably/ably-client";

interface AblyRealtimeProviderProps {
  meetingLink: string;
  meetingCipherKey: string;
  children: React.ReactNode;
}
export default function AblyRealtimeProvider({
  meetingLink,
  meetingCipherKey,
  children,
}: AblyRealtimeProviderProps) {
  const client = ablyRealtime;
  const cipherKey = Buffer.from(meetingCipherKey, "base64");

  return (
    <AblyProvider client={client}>
      <ChannelProvider
        channelName={`meeting:${meetingLink}`}
        options={{ cipher: { key: cipherKey } }}
      >
        {children}
      </ChannelProvider>
    </AblyProvider>
  );
}
