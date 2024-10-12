import Stream from "@/components/Stream";
import { db } from "@/lib/db/db";
import { avatarTable, meetingSessionTable } from "@/lib/db/schema";
import { getSessionByMeetingLink } from "@/lib/utils.server";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function ClientSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const session = await getSessionByMeetingLink(params.session); // params.session in this context is the meeting link
  if (!session) notFound();

  const res = await db
    .select({ idleVideoUrl: avatarTable.idleVideoUrl })
    .from(meetingSessionTable)
    .innerJoin(avatarTable, eq(meetingSessionTable.avatarId, avatarTable.id))
    .where(eq(meetingSessionTable.meetingLink, session.meetingLink))
    .limit(1);

  if (!res[0] || !res[0].idleVideoUrl) {
    console.log("idle video not found");
    notFound();
  }
  const idleVideoUrl = res[0].idleVideoUrl;

  return (
    <div>
      <Stream meetingLink={session.meetingLink} idleVideoUrl={idleVideoUrl} />
    </div>
  );
}
