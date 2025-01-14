import { headers } from "next/headers";
import { redis } from "@/lib/integrations/redis";
import { publishWebRTCStatusAction } from "@/app/actions/meetingSession";

const RATE_LIMIT_REQUESTS = 10; // Maximum requests per window
const RATE_LIMIT_WINDOW = 60; // Window in seconds

async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rate_limit:${ip}`;

  try {
    // Get current count for this IP
    const requests = await redis.incr(key);

    // Set expiry on first request
    if (requests === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    return requests > RATE_LIMIT_REQUESTS;
  } catch (error) {
    console.error("Rate limiting error:", error);
    return false; // Fail open if Redis is down
  }
}

// This route is called when a user closes the WebRTC session page (the video streaming page)
export async function POST(req: Request) {
  try {
    // 1. Validate origin
    const headersList = await headers();
    const origin = headersList.get("origin");
    const allowedOrigins = [process.env.APP_URL];

    if (!origin || !allowedOrigins.includes(origin)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Get IP address
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

    // 3. Check rate limit
    const limited = await isRateLimited(ip);
    if (limited) {
      return Response.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": RATE_LIMIT_WINDOW.toString(),
          },
        }
      );
    }

    // 4. Validate input
    const meetingLink = await req.json();
    if (!meetingLink || typeof meetingLink !== "string") {
      return Response.json({ error: "Invalid meeting link" }, { status: 400 });
    }

    await publishWebRTCStatusAction(meetingLink, false);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error in 'did-webrtc/close'", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
