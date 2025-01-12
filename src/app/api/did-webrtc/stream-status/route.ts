import { validateRequest } from "@/lib/auth";
import { getWebRTCStatus } from "@/services";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const meetingLink = searchParams.get("meetingLink");

  if (!meetingLink) {
    return new Response("Meeting link required", { status: 400 });
  }

  const { session } = await validateRequest();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // TODO: make sure user is the owner of the meetingLink session
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial status
      const initialStatus = await getWebRTCStatus(meetingLink);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: initialStatus })}\n\n`)
      );

      let lastStatus = initialStatus;

      const interval = setInterval(async () => {
        try {
          const currentStatus = await getWebRTCStatus(meetingLink);
          if (currentStatus !== lastStatus) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ status: currentStatus })}\n\n`)
            );
            lastStatus = currentStatus;
          }
        } catch (error) {
          console.error("Error checking status:", error);
          controller.error(error);
        }
      }, 2000);

      // Clean up on close
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
