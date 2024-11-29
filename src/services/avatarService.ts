import { db } from "@/lib/db/db";
import { type Avatar, avatars, meetingSessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserAvatars(userId: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      usersToAvatars: {
        with: {
          avatar: true,
        },
      },
    },
  });
  return result?.usersToAvatars.map((ua) => ua.avatar) ?? [];
}

export async function getAvatarByMeetingLink(
  meetingLink: string
): Promise<Avatar | null> {
  const result = await db
    .select()
    .from(meetingSessions)
    .innerJoin(avatars, eq(meetingSessions.avatarId, avatars.id))
    .where(eq(meetingSessions.meetingLink, meetingLink))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].avatar || null;
}
