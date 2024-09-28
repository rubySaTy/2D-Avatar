import { notFound } from "next/navigation";
import InputArea from "@/components/InputArea";
import SessionLink from "@/components/SessionLink";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/getMeetingSession";

export default async function TherapistSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const session = await getSession(params.session);
  if (!session) {
    notFound();
  }

  const appUrl = process.env.APP_URL;
  const clientUrl = new URL(`${appUrl}/client/${session.meetingLink}`);

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Session Link</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionLink clientUrl={clientUrl.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <InputArea
            sessionId={session.didSessionId}
            streamId={session.didStreamId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
