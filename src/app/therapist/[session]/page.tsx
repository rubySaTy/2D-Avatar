import path from "path";
import { readFileSync } from "fs";
import { notFound } from "next/navigation";
import { getMeetingSession } from "@/services";
import { validateRequest } from "@/lib/auth";
import TherapistMeetingDashboard from "@/components/therapist/therapist-session-panel/TherapistMeetingDashboard";
import type { MicrosoftVoice } from "@/lib/types";

export default async function TherapistSessionPage(props: {
  params: Promise<{ session: string }>;
}) {
  const params = await props.params;
  const meetingLink = params.session;
  const meetingSessionData = await getMeetingSession(meetingLink);
  if (!meetingSessionData) notFound();

  const { user } = await validateRequest();
  // Make sure the user is the owner of the session
  if (meetingSessionData.userId !== user?.id) notFound(); // Forbidden

  const { avatar } = meetingSessionData;
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
  const microsoftVoices = data.filter((voice) => voice.provider === "microsoft");

  // Extract available genders and languages
  const availableGenders = Array.from(
    new Set(microsoftVoices.map((voice) => voice.gender))
  ).sort();

  const availableLanguages = Array.from(
    new Set(
      microsoftVoices.flatMap((voice) => voice.languages.map((lang) => lang.language))
    )
  ).sort();

  // collecting unique age groups from voices data
  const ageGroups = Array.from(new Set(microsoftVoices.map((voice) => voice.ageGroup)));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <TherapistMeetingDashboard
        avatarImageUrl={avatar.imageUrl}
        avatarName={avatar.avatarName}
        clientUrl={clientUrl.toString()}
        meetingLink={meetingLink}
        meetingCipherKey={meetingSessionData.cipherKey.toString("base64")}
        VoiceSelectorProps={{
          voices: microsoftVoices,
          genders: availableGenders,
          languages: availableLanguages,
          ageGroups,
        }}
      />
    </div>
  );
}
