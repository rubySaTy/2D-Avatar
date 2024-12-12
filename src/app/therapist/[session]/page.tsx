import path from "path";
import { readFileSync } from "fs";
import { notFound } from "next/navigation";
import TherapistInteractionPanel from "@/components/TherapistPanel/TherapistInteractionPanel";
import { getAvatarByMeetingLink } from "@/services";
import TherapistPanelHeader from "@/components/TherapistPanel/TherapistPanelHeader";
import type { MicrosoftVoice } from "@/lib/types";

export default async function TherapistSessionPage(props: {
  params: Promise<{ session: string }>;
}) {
  const params = await props.params;
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
      <TherapistPanelHeader
        avatarImageUrl={avatar.imageUrl}
        avatarName={avatar.avatarName}
        clientUrl={clientUrl.toString()}
      />
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
