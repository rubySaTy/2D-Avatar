import Stream from "@/components/Stream";
import { getSessionByMeetingLink } from "@/lib/getMeetingSession";
import { notFound } from "next/navigation";

export default async function ClientSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const session = await getSessionByMeetingLink(params.session); // params.session in this context is the meeting link
  if (!session) notFound();

  return (
    <div>
      <Stream meetingLink={params.session} />
    </div>
  );
}
