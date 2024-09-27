import { eq } from "drizzle-orm";
import { meetingSessionTable, type MeetingSession } from "./db/schema";
import { db } from "./db/db";

export async function getSession(
  session: string
): Promise<MeetingSession | null> {
  try {
    const sessions = await db
      .select()
      .from(meetingSessionTable)
      .where(eq(meetingSessionTable.meetingLink, session))
      .limit(1);

    return sessions[0] || null;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}
