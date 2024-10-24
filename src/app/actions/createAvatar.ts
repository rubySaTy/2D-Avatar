"use server";

import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { avatarTable, type NewAvatar } from "@/lib/db/schema";
import { createIdleVideo, getIdleVideo, uploadToS3 } from "@/lib/utils.server";
import { sanitizeFilename, sanitizeString } from "@/lib/utils";
import s3Client from "@/lib/s3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

const avatarSchema = z.object({
  avatarName: z.string().min(1),
  userId: z.string().min(1),
  picture: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Only image files are allowed",
    }),
});

// Type for tracking uploaded resources that might need cleanup
interface UploadedResources {
  s3Objects: { bucket: string; key: string }[];
}

export async function createAvatar(prevState: any, formData: FormData) {
  const parsedData = avatarSchema.safeParse({
    avatarName: formData.get("avatarName"),
    userId: formData.get("userId"),
    picture: formData.get("picture"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarName, picture, userId } = parsedData.data;
  const uploadedResources: UploadedResources = {
    s3Objects: [],
  };

  const s3BucketName = process.env.AWS_BUCKET_NAME;
  if (!s3BucketName) {
    return { success: false, message: "S3 bucket not configured" };
  }

  try {
    // Step 1: Upload initial image
    const sanitizedAvatarName = sanitizeString(avatarName);
    const sanitizedFileName = sanitizeFilename(picture.name);
    const fileName = `${sanitizedAvatarName}-${sanitizedFileName}`;
    const { url: imageUrl, key: imageKey } = await uploadToS3(
      picture.stream(),
      "avatars/",
      `${fileName}`,
      picture.type
    );
    uploadedResources.s3Objects.push({ bucket: s3BucketName, key: imageKey });

    // Step 2: Create idle video
    const createdIdleVideoRes = await createIdleVideo(imageUrl);
    if (!createdIdleVideoRes) {
      await cleanupResources(uploadedResources);
      return { success: false, message: "Error creating idle video" };
    }

    // Step 3: Poll for idle video completion
    // Polling to get the silent idle video
    const idleVideo = await getIdleVideo(createdIdleVideoRes.id);
    if (!idleVideo) {
      await cleanupResources(uploadedResources);
      return { success: false, message: "Error fetching idle video" };
    }

    // Step 4: Download and upload final video
    // download video as a Buffer using Axios
    const res = await axios.get(idleVideo.result_url, {
      responseType: "arraybuffer",
    });
    const videoBuffer = Buffer.from(res.data, "binary");

    const uniqueId = randomUUID();
    const videoFileName = `${uniqueId}.mp4`;
    const { url: idleVideoUrl, key: idleVideoKey } = await uploadToS3(
      videoBuffer,
      "videos/",
      videoFileName,
      "video/mp4"
    );
    uploadedResources.s3Objects.push({
      bucket: s3BucketName,
      key: idleVideoKey,
    });

    // Step 5: Database insertion
    const newAvatar: NewAvatar = {
      userId,
      avatarName,
      imageUrl,
      idleVideoUrl: idleVideoUrl,
    };

    await db.insert(avatarTable).values(newAvatar);
    return { success: true, message: "Avatar created" };
  } catch (error: any) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

async function cleanupResources(resources: UploadedResources) {
  // Cleanup S3 objects
  for (const obj of resources.s3Objects) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: obj.bucket,
          Key: obj.key,
        })
      );
    } catch (error) {
      console.error(`Failed to delete S3 object ${obj.key}:`, error);
    }
  }
}
