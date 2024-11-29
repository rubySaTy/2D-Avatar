import { db } from "@/lib/db/db";
import {
  avatars,
  meetingSessions,
  type Avatar,
  type MeetingSession,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getMeetingDataByMeetingLink(
  meetingLink: string
): Promise<{ session: MeetingSession; avatar: Avatar } | null> {
  const results = await db
    .select()
    .from(meetingSessions)
    .leftJoin(avatars, eq(meetingSessions.avatarId, avatars.id))
    .where(eq(meetingSessions.meetingLink, meetingLink))
    .limit(1);

  if (results.length === 0) return null;

  const result = results[0];

  if (!result.avatar || !result.meeting_session) return null;

  return {
    session: result.meeting_session,
    avatar: result.avatar,
  };
}
