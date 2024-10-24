import { eq } from "drizzle-orm";
import { db } from "./db/db";
import {
  avatarTable,
  meetingSessionTable,
  userTable,
  type Avatar,
  type MeetingSession,
} from "./db/schema";
import axios, { type AxiosResponse, type AxiosRequestConfig } from "axios";
import s3Client from "./s3Client";
import { Upload } from "@aws-sdk/lib-storage";
import type {
  ObjectCannedACL,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import type {
  DIDCreateTalkApiResponse,
  DIDGetTalkApiResponse,
  PollConfig,
} from "./types";

export function shortUUID(): string {
  const uuid: string = crypto.randomUUID();

  // Remove dashes and convert to a Uint8Array
  const byteArray: Uint8Array = new Uint8Array(16);
  const hexWithoutDashes: string = uuid.replace(/[-]/g, "");

  const matches = hexWithoutDashes.match(/.{1,2}/g);
  if (matches) {
    matches.forEach((byte, i) => {
      byteArray[i] = parseInt(byte, 16);
    });
  }

  // Convert Uint8Array to a regular array and then to base64
  const base64: string = btoa(
    String.fromCharCode.apply(null, Array.from(byteArray))
  );
  return base64
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .substring(0, 10);
}

export async function findUserByUsername(username: string) {
  const user = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1);

  return user.length > 0 ? user[0] : null;
}

export async function isUsernameUnique(username: string): Promise<boolean> {
  const user = await findUserByUsername(username);
  return !user; // Returns true if no user is found
}

export async function createIdleVideo(imageUrl: string) {
  try {
    const res = await axios<DIDCreateTalkApiResponse>(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: {
          source_url: imageUrl,
          driver_url: "bank://lively/driver-06",
          script: {
            type: "text",
            ssml: true,
            input:
              '<break time="5000ms"/><break time="5000ms"/><break time="5000ms"/>',
            provider: {
              type: "microsoft",
              voice_id: "en-US-JennyNeural",
            },
          },
          config: { fluent: true },
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getIdleVideo(
  id: string
): Promise<DIDGetTalkApiResponse | null> {
  try {
    const url = `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/${id}`;
    const config: AxiosRequestConfig = {
      method: "GET",
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const pollConfig: PollConfig<DIDGetTalkApiResponse> = {
      maxRetries: 10,
      initialRetryDelay: 1000,
      maxRetryDelay: 10000,
      shouldRetry: (data) => data.status !== "done",
    };

    const res = await fetchWithRetries<DIDGetTalkApiResponse>(
      url,
      config,
      pollConfig
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching idle video:", error);
    return null;
  }
}

async function fetchWithRetries<T>(
  url: string,
  config: AxiosRequestConfig = {},
  pollConfig: PollConfig<T>
): Promise<AxiosResponse<T>> {
  const { maxRetries, initialRetryDelay, maxRetryDelay, shouldRetry } =
    pollConfig;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios<T>(url, config);

      if (!shouldRetry(response.data)) {
        return response;
      }

      const delay = Math.min(
        initialRetryDelay * Math.pow(2, attempt),
        maxRetryDelay
      );

      console.warn(
        `Status not yet 'done', retrying in ${delay}ms... (${
          attempt + 1
        }/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(
        initialRetryDelay * Math.pow(2, attempt),
        maxRetryDelay
      );

      console.warn(
        `Request failed, retrying in ${delay}ms... (${
          attempt + 1
        }/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries reached without achieving desired status");
}

export async function getSessionByMeetingLink(
  session: string
): Promise<MeetingSession | null> {
  try {
    const sessions = await db
      .select()
      .from(meetingSessionTable)
      .where(eq(meetingSessionTable.meetingLink, session))
      .limit(1);

    return sessions[0] || null;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

export async function getAvatarByMeetingLink(
  meetingLink: string
): Promise<Avatar | null> {
  const result = await db
    .select()
    .from(meetingSessionTable)
    .innerJoin(avatarTable, eq(meetingSessionTable.avatarId, avatarTable.id))
    .where(eq(meetingSessionTable.meetingLink, meetingLink))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].avatar || null;
}

/**
 * Uploads data to AWS S3 using the Upload class for handling streams.
 *
 * @param data - The data to upload (Buffer, ReadableStream, Blob, etc.).
 * @param folder - The folder/path within the S3 bucket (e.g., 'avatars/', 'videos/').
 * @param fileName - The name of the file (e.g., 'image.png', 'video.mp4').
 * @param contentType - The MIME type of the file (e.g., 'image/png', 'video/mp4').
 * @param acl - Access control list setting (default: 'public-read').
 * @returns The URL of the uploaded file.
 */
export async function uploadToS3(
  data: Buffer | ReadableStream | Blob,
  folder: string,
  fileName: string,
  contentType: string,
  acl: ObjectCannedACL = "public-read"
): Promise<string> {
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const key = `${folder}${Date.now()}-${fileName}`;

  const uploadParams: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ACL: acl,
    ContentType: contentType,
  };

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: uploadParams,
      // You can adjust concurrency and part size as needed
      queueSize: 4, // concurrency
      partSize: 5 * 1024 * 1024, // 5 MB
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
      console.log(`Uploaded ${progress.loaded} of ${progress.total}`);
    });

    await parallelUploads3.done();

    // Construct the S3 URL
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}
