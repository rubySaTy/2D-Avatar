import Stream from "@/components/Stream";
import { getAvatarByMeetingLink } from "@/lib/utils.server";
import { notFound } from "next/navigation";

export default async function ClientSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const meetingLink = params.session;
  const avatar = await getAvatarByMeetingLink(meetingLink);

  if (!avatar || !avatar.idleVideoUrl) {
    console.log("idle video not found");
    notFound();
  }

  return (
    <div className="flex items-center justify-center min-h-[700px]">
      <Stream meetingLink={meetingLink} idleVideoUrl={avatar.idleVideoUrl} />
    </div>
  );
}
