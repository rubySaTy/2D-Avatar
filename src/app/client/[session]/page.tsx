import { userAgent } from "next/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getMeetingSession } from "@/services";
import Stream from "@/components/Stream";
import VideoMeeting from "@/components/meeting/VideoMeeting";

function decideDIDCodec(
  browserName?: string,
  osName?: string,
  engineName?: string
): "on" | "off" {
  // Default to VP8
  let codecMode: "on" | "off" = "on";

  // iOS or Safari-based → H.264
  // - iOS browsers always use WebKit behind the scenes (including chrome and firefox)
  // - Safari on macOS also tends to do better with H.264
  const isIOS = osName?.toLowerCase().includes("ios");
  const isSafariEngine = engineName?.toLowerCase() === "webkit";
  const isSafariBrowser = browserName?.toLowerCase().includes("safari");
  // note: "mobile safari" => also has "safari" in the name

  if (isIOS || isSafariEngine || isSafariBrowser) {
    codecMode = "off"; // => H.264
  }

  return codecMode;
}

export default async function ClientSessionPage(props: {
  params: Promise<{ session: string }>;
}) {
  const [headersList, params] = await Promise.all([headers(), props.params]);
  const { browser, os, engine } = userAgent({ headers: headersList });
  const DIDCodec = decideDIDCodec(browser.name, os.name, engine.name);

  const meetingLink = params.session;
  const meetingSessionData = await getMeetingSession(meetingLink);

  if (!meetingSessionData) notFound();
  const { avatar } = meetingSessionData;
  if (!avatar.idleVideoUrl) return <p>No idle video available</p>;

  return (
    <div>
      {/* <VideoMeeting name="client" room={meetingLink} /> */}
      <Stream
        meetingLink={meetingLink}
        idleVideoUrl={avatar.idleVideoUrl}
        DIDCodec={DIDCodec}
      />
    </div>
  );
}
