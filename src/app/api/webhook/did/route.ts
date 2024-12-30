import axios from "axios";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { DIDGetTalkResponse } from "@/lib/types";
import { deleteS3Objects, updateAvatar, uploadToS3 } from "@/services";
import { redis } from "@/lib/integrations/redis";

async function safeDeleteS3Objects(keys: string[]) {
  try {
    await deleteS3Objects(keys);
  } catch (error) {
    console.error("Error during S3 cleanup:", error);
  }
}

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const correlationId = requestHeaders.get("x-did-correlationid");

  if (!correlationId) {
    console.error("No correlation ID found in request headers");
    return NextResponse.json({ error: "Correlation ID missing" }, { status: 400 });
  }

  let s3VideoKey: string | null = null;

  try {
    const data = (await request.json()) as DIDGetTalkResponse;
    if (!data || !data.result_url) {
      console.error("No data or result_url received from DID webhook");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const res = await axios.get(data.result_url, {
      responseType: "arraybuffer",
    });
    const videoBuffer = Buffer.from(res.data, "binary");

    const uniqueId = crypto.randomUUID();
    const videoFileName = `${uniqueId}.mp4`;
    const { url: idleVideoUrl, key: idleVideoKey } = await uploadToS3(
      videoBuffer,
      "videos/",
      videoFileName,
      "video/mp4"
    );

    s3VideoKey = idleVideoKey;

    const avatarId = (await redis.get(correlationId)) as number;
    if (!avatarId) {
      console.error("No avatar ID found for correlation ID");
      await safeDeleteS3Objects([s3VideoKey]);
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    await updateAvatar(avatarId, {
      idleVideoKey,
      idleVideoUrl,
    });

    revalidatePath("/admin");
    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing DID webhook:", error);
    if (s3VideoKey) await safeDeleteS3Objects([s3VideoKey]);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
