import { notFound } from "next/navigation";
import Stream from "@/components/Stream";
import VoiceCapture from "@/components/VoiceCapture";
import { getMeetingSessionWithAvatar } from "@/services";
import { Card } from "@/components/ui/card";

export default async function ClientSessionPage(props: {
  params: Promise<{ session: string }>;
}) {
  const params = await props.params;
  const meetingLink = params.session;
  const meetingSessionData = await getMeetingSessionWithAvatar(meetingLink);

  if (!meetingSessionData) notFound();
  const { avatar } = meetingSessionData;
  if (!avatar.idleVideoUrl) notFound();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex items-center justify-center">
        <Stream meetingLink={meetingLink} idleVideoUrl={avatar.idleVideoUrl} />
      </div>

      <Card className="flex-1 flex items-center justify-center w-full max-w-6xl mx-auto overflow-hidden">
        <VoiceCapture meetingLink={meetingLink} />
      </Card>
    </div>
  );
}
