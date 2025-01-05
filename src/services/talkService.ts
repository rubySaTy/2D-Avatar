import "server-only";

import { db } from "@/lib/db/db";
import { type NewTalk, talks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function createTalkInDb(newTalk: NewTalk) {
  return db.insert(talks).values(newTalk);
}

export async function getTalksWithUserData() {
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
