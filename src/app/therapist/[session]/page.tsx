import InputArea from "@/components/InputArea";
import { getSession } from "@/lib/getMeetingSession";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function TherapistSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const session = await getSession(params.session);
  if (!session) {
    notFound();
  }

  const clientUrl = new URL(
    `http://localhost:3001/client/${session.meetingLink}`
  );

  return (
    <div className="grid w-full gap-1.5">
      <InputArea
        sessionId={session.didSessionId}
        streamId={session.didStreamId}
      />
      <Link href={clientUrl.toString()}>{clientUrl.toString()}</Link>
    </div>
  );
}
