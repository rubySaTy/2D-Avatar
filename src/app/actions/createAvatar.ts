"use server";

import axios from "axios";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db/db";
import { avatarTable, type NewAvatar } from "@/lib/db/schema";
import { createIdleVideo, getIdleVideo, uploadToS3 } from "@/lib/utils.server";
import { sanitizeFilename, sanitizeString } from "@/lib/utils";

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

  try {
    const sanitizedAvatarName = sanitizeString(avatarName);
    const sanitizedFileName = sanitizeFilename(picture.name);
    const imageUrl = await uploadToS3(
      picture.stream(),
      "avatars/",
      `${sanitizedAvatarName}-${sanitizedFileName}`,
      picture.type
    );

    const createdIdleVideoRes = await createIdleVideo(imageUrl);
    if (!createdIdleVideoRes) {
      return { success: false, message: "Error creating idle video" };
    }

    // Polling to get the silent idle video
    const idleVideo = await getIdleVideo(createdIdleVideoRes.id);
    if (!idleVideo) {
      return { success: false, message: "Error fetching idle video" };
    }

    const idleVideoUrl = idleVideo.result_url;
    // download video as a Buffer using Axios
    const res = await axios.get(idleVideoUrl, { responseType: "arraybuffer" });
    const videoBuffer = Buffer.from(res.data, "binary");

    const uniqueId = randomUUID();
    const s3Key = `${uniqueId}.mp4`;
    const s3Url = await uploadToS3(videoBuffer, "videos/", s3Key, "video/mp4");

    const newAvatar: NewAvatar = {
      userId,
      avatarName,
      imageUrl,
      idleVideoUrl: s3Url,
    };

    await db.insert(avatarTable).values(newAvatar);
    return { success: true, message: "Avatar created" };
  } catch (error: any) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}
