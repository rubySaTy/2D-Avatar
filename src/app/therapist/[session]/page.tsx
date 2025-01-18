import path from "path";
import { readFileSync } from "fs";
import { notFound } from "next/navigation";
import { getMeetingSession } from "@/services";
import { validateRequest } from "@/lib/auth";
import TherapistMeetingDashboard from "@/components/therapist/therapist-session-panel/TherapistMeetingDashboard";
import type { MicrosoftVoice, VoiceList } from "@/lib/types";

async function getVoices(): Promise<VoiceList> {
  // Fetch data from the public directory
  const jsonDirectory = path.join(process.cwd(), "public");
  const fileContents = readFileSync(
    path.join(jsonDirectory, "microsoft-voices.json"),
    "utf8"
  );
  const data: MicrosoftVoice[] = JSON.parse(fileContents);

  // Filter for Microsoft provider
  const voices = data.filter((voice) => voice.provider === "microsoft");

  // Extract available genders and languages
  const genders = Array.from(new Set(voices.map((voice) => voice.gender))).sort();

  const languages = Array.from(
    new Set(voices.flatMap((voice) => voice.languages.map((lang) => lang.language)))
  ).sort();

  // collecting unique age groups from voices data
  const ageGroups = Array.from(new Set(voices.map((voice) => voice.ageGroup)));

  return { voices, genders, languages, ageGroups };
}

export default async function TherapistSessionPage(props: {
  params: Promise<{ session: string }>;
}) {
  const params = await props.params;
  const meetingLink = params.session;

  const [meetingSessionData, voiceList] = await Promise.all([
    getMeetingSession(meetingLink),
    getVoices(),
  ]);
  if (!meetingSessionData) notFound();

  const { user } = await validateRequest();
  // Make sure the user is the owner of the session
  if (meetingSessionData.userId !== user?.id) notFound(); // Forbidden

  const { avatar } = meetingSessionData;
  const clientUrl = new URL(`${process.env.APP_URL}/client/${meetingLink}`);

  return (
    <div className="container mx-auto lg:px-4 space-y-6">
      <TherapistMeetingDashboard
        therapistUsername={user.username}
        avatarImageUrl={avatar.imageUrl}
        avatarName={avatar.avatarName}
        clientUrl={clientUrl.toString()}
        meetingLink={meetingLink}
        meetingCipherKey={meetingSessionData.cipherKey.toString("base64")}
        voiceList={voiceList}
      />
    </div>
  );
}
