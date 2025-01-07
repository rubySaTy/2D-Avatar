import { notFound } from "next/navigation";
import Stream from "@/components/Stream";
import { getMeetingSession } from "@/services";

export default async function ClientSessionPage(props: {
  params: Promise<{ session: string }>;
}) {
  const params = await props.params;
  const meetingLink = params.session;
  const meetingSessionData = await getMeetingSession(meetingLink);

  if (!meetingSessionData) notFound();
  const { avatar } = meetingSessionData;
  if (!avatar.idleVideoUrl) notFound();

  return (
    <div>
      <Stream meetingLink={meetingLink} idleVideoUrl={avatar.idleVideoUrl} />
    </div>
  );
}
