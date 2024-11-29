import { notFound } from "next/navigation";
import Stream from "@/components/Stream";
import { getAvatarByMeetingLink } from "@/services";

export default async function ClientSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const meetingLink = params.session;
  const avatar = await getAvatarByMeetingLink(meetingLink);

  if (!avatar || !avatar.idleVideoUrl) {
    notFound();
  }

  return (
    <div className="flex items-center justify-center min-h-[700px]">
      <Stream meetingLink={meetingLink} idleVideoUrl={avatar.idleVideoUrl} />
    </div>
  );
}
