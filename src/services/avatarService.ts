import { db } from "@/lib/db/db";
import { type Avatar, meetingSessions, users } from "@/lib/db/schema";
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
  try {
    const result = await db.query.meetingSessions.findFirst({
      where: eq(meetingSessions.meetingLink, meetingLink),
      with: {
        avatar: true,
      },
    });

    if (!result) return null;
    return result.avatar;
  } catch (error) {
    console.error("Error getting avatar by meeting link from DB:", error);
    return null;
  }
}

export async function getAvatars() {
  return db.query.avatars.findMany();
}
