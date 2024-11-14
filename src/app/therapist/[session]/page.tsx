import path from "path";
import { readFileSync } from "fs";
import Image from "next/image";
import { notFound } from "next/navigation";
import SessionLink from "@/components/SessionLink";
import TherapistInteractionPanel from "@/components/TherapistInteractionPanel";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="relative h-16 w-16 rounded-full overflow-hidden">
            <Image
              src={avatar.imageUrl}
              alt="Avatar image"
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 128px) 100vw, (max-width: 128px) 50vw, 33vw" // TODO: make responsive, check correct sizes for all devices.
              priority
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-xl font-semibold tracking-tight">
              Therapy Session
            </h1>
            <p className="text-sm text-muted-foreground">
              Avatar name: {avatar.avatarName}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <SessionLink clientUrl={clientUrl.toString()} />
          <Button variant="destructive" size="sm">
            End Session
          </Button>
        </div>
      </div>
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
