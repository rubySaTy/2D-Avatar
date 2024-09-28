import { redirect } from "next/navigation";
import CreateSession from "@/components/CreateSession";
import { db } from "@/lib/db/db";
import { eq } from "drizzle-orm";
import { avatarTable } from "@/lib/db/schema";
import { getUser } from "@/lib/getUser";

export default async function TherapistPage() {
  const user = await getUser();
  if (!user) {
    return redirect("/login");
  }

  const avatarRecords = await db
    .select()
    .from(avatarTable)
    .where(eq(avatarTable.userId, user.id));

  // const meetingSessions = await db
  // .select()
  // .from(meetingSessionTable)
  // .where(eq(meetingSessionTable.userId, user.id));

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <CreateSession avatars={avatarRecords} />
    </div>
  );
}
