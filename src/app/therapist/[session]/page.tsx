import { notFound } from "next/navigation";
import InputArea from "@/components/InputArea";
import SessionLink from "@/components/SessionLink";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getSessionByMeetingLink } from "@/lib/getMeetingSession";
import path from "path";
import { readFileSync } from "fs";
import type { Voice } from "@/lib/types";

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

  // Fetch data from the public directory
  const jsonDirectory = path.join(process.cwd(), "public");
  const fileContents = readFileSync(
    path.join(jsonDirectory, "voices.json"),
    "utf8"
  );
  const data: Voice[] = JSON.parse(fileContents);

  // Filter for Microsoft provider
  const microsoftVoices = data.filter(
    (voice) => voice.provider === "microsoft"
  );

  // Extract available genders and languages
  const availableGenders = Array.from(
    new Set(microsoftVoices.map((voice) => voice.gender))
  ).sort();

  const availableLanguages = Array.from(
    new Set(
      microsoftVoices.flatMap((voice) =>
        voice.languages.map((lang) => lang.language)
      )
    )
  ).sort();

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
            meetingLink={session.meetingLink}
            VoiceSelectorProps={{
              voices: microsoftVoices,
              genders: availableGenders,
              languages: availableLanguages,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
