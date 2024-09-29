import { notFound } from "next/navigation";
import InputArea from "@/components/InputArea";
import SessionLink from "@/components/SessionLink";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSessionByMeetingLink } from "@/lib/getMeetingSession";

export default async function TherapistSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const session = await getSessionByMeetingLink(params.session); // params.session in this context is the meeting link
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
          <InputArea meetingLink={session.meetingLink} />
        </CardContent>
      </Card>
    </div>
  );
}
