import { db } from "@/lib/db/db";
import { talks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getTalksWithUser() {
  const results = await db.query.talks.findMany({
    orderBy: [desc(talks.createdAt)],
    with: {
      meetingSession: {
        columns: {},
        with: { user: { columns: { id: true, username: true } } },
      },
    },
  });

  return results.map((talk) => ({
    id: talk.id,
    createdAt: talk.createdAt,
    meetingSessionId: talk.meetingSessionId,
    user: talk.meetingSession.user,
  }));
}
