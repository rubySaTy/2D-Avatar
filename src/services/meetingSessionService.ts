import { db } from "@/lib/db/db";
import { meetingSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getMeetingSessionWithAvatarAndUser(meetingLink: string) {
  const result = await db.query.meetingSessions.findFirst({
    where: eq(meetingSessions.meetingLink, meetingLink),
    with: {
      avatar: true,
      user: { columns: { role: true } },
    },
  });

  return result;
}
