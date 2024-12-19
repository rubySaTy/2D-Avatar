import { db } from "@/lib/db/db";
import {
  type Avatar,
  type MeetingSession,
  meetingSessions,
  users,
} from "@/lib/db/schema";
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

type MeetingSessionWithAvatar = MeetingSession & {
  avatar: Avatar;
};

// TODO: should be moved to meetingSession service?
export async function getMeetingSessionWithAvatar(
  meetingLink: string
): Promise<MeetingSessionWithAvatar | null> {
  try {
    const result = await db.query.meetingSessions.findFirst({
      where: eq(meetingSessions.meetingLink, meetingLink),
      with: {
        avatar: true,
      },
    });

    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Error getting avatar by meeting link from DB:", error);
    return null;
  }
}

export async function getAvatars() {
  return db.query.avatars.findMany();
}
