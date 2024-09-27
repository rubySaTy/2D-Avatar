import Stream from "@/components/Stream";
import StreamingComponent from "@/components/StreamingComponent";
import { getSession } from "@/lib/getMeetingSession";
import { notFound } from "next/navigation";

export default async function ClientSessionPage({
  params,
}: {
  params: { session: string };
}) {
  const session = await getSession(params.session);

  if (!session) {
    notFound();
  }

  return (
    <div>
      {/* <StreamingComponent
        iceServers={session.iceServers as Array<RTCIceServer>}
        didStreamId={session.didStreamId}
        offer={session.offer as RTCSessionDescriptionInit}
        didSessionId={session.didSessionId}
      /> */}
      <Stream
        didStreamId={session.didStreamId}
        didSessionId={session.didSessionId}
        offer={session.offer as RTCSessionDescriptionInit}
        iceServers={session.iceServers as Array<RTCIceServer>}
      />
    </div>
  );
}
