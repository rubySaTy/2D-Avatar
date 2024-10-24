import path from "path";
import { readFileSync } from "fs";
import Image from "next/image";
import { notFound } from "next/navigation";
import SessionLink from "@/components/SessionLink";
import TherapistInteractionPanel from "@/components/TherapistInteractionPanel";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getAvatarByMeetingLink } from "@/lib/utils.server";
import type { MicrosoftVoice } from "@/lib/types";

export default async function TherapistSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const meetingLink = params.session;
  const avatar = await getAvatarByMeetingLink(meetingLink);
  if (!avatar) {
    notFound();
  }

  const appUrl = process.env.APP_URL;
  const clientUrl = new URL(`${appUrl}/client/${meetingLink}`);

  // Fetch data from the public directory
  const jsonDirectory = path.join(process.cwd(), "public");
  const fileContents = readFileSync(
    path.join(jsonDirectory, "microsoft-voices.json"),
    "utf8"
  );
  const data: MicrosoftVoice[] = JSON.parse(fileContents);

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
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden">
            <Image
              src={avatar.imageUrl}
              alt="Avatar image"
              fill={true}
              style={{ objectFit: "cover" }}
              sizes="(max-width: 128px) 100vw, (max-width: 128px) 50vw, 33vw" // TODO: make responsive, check correct sizes for all devices.
              priority
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold">Therapy Session</h1>
            <p className="text-muted-foreground">
              Avatar name: {avatar.avatarName}
            </p>
          </div>
        </div>
        {/* TODO: add funcitonality */}
        <Button variant="destructive">End Session</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Session Link</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-2">
          <SessionLink clientUrl={clientUrl.toString()} />
        </CardContent>
      </Card>
      <TherapistInteractionPanel
        meetingLink={meetingLink}
        VoiceSelectorProps={{
          voices: microsoftVoices,
          genders: availableGenders,
          languages: availableLanguages,
        }}
      />
    </div>
  );
}
