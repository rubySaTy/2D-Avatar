import { redirect } from "next/navigation";
import CreateSession from "@/components/CreateSession";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db/db";
import { eq } from "drizzle-orm";
import { avatarTable, meetingSessionTable } from "@/lib/db/schema";
import { getUser } from "@/lib/getUser";
import PreviousSessionsSelect from "@/components/PreviousSessionsSelect";

export default async function TherapistPage() {
  const user = await getUser();
  if (!user) {
    return redirect("/login");
  }

  const avatarRecords = await db
    .select()
    .from(avatarTable)
    .where(eq(avatarTable.userId, user.id));

  const meetingSessions = await db
    .select()
    .from(meetingSessionTable)
    .where(eq(meetingSessionTable.userId, user.id));

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create a Session</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateSession avatars={avatarRecords} />
        </CardContent>
      </Card>
      <p>--- OR ---</p>
      <Card>
        <CardHeader>
          <CardTitle>choose from previous sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <PreviousSessionsSelect sessions={meetingSessions} />
        </CardContent>
      </Card>
    </div>
  );
}
