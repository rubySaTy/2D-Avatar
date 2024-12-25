import { db } from "@/lib/db/db";
import { meetingSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getMeetingSessionCipherKey(meetingLink: string) {
  const result = await db.query.meetingSessions.findFirst({
    where: eq(meetingSessions.meetingLink, meetingLink),
    columns: { cipherKey: true },
  });

  return result?.cipherKey;
}

export async function getMeetingSessionWithAvatarAndUser(meetingLink: string) {
  return db.query.meetingSessions.findFirst({
    where: eq(meetingSessions.meetingLink, meetingLink),
    with: {
      avatar: true,
      user: { columns: { role: true } },
    },
  });
}
