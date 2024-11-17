"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import axios from "axios";
import * as argon2 from "argon2";
import { db } from "@/lib/db/db";
import {
  users,
  NewUser,
  avatars,
  NewAvatar,
  usersToAvatars,
} from "@/lib/db/schema";
import {
  createIdleVideo,
  findUser,
  getIdleVideo,
  uploadToS3,
} from "@/lib/utils.server";
import s3Client from "@/lib/s3Client";
import { avatarSchema, createUserSchema } from "@/lib/validationSchema";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { generateIdFromEntropySize } from "lucia";
import { z } from "zod";
import { eq } from "drizzle-orm";
import elevenlabs from "@/lib/elevenlabs";
import { sanitizeString, sanitizeFilename } from "@/lib/utils";

const userIdSchema = z.string().min(1, { message: "User ID cannot be empty." });

export async function deleteUser(formData: FormData) {
  const id = formData.get("id");
  const parseResult = userIdSchema.safeParse(id);

  if (!parseResult.success) {
    console.error(parseResult.error.errors);
    return;
  }

  const userId = parseResult.data;
  try {
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

export async function createUser(prevState: any, formData: FormData) {
  const parseResult = createUserSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const { username, email, password, role } = parseResult.data;

  try {
    const foundUser = await findUser(username, email);
    TODO: "Describe what already exists, username or email";
    if (foundUser) {
      return { success: false, message: "User already exists" };
    }

    const passwordHash = await argon2.hash(password);
    const newUser: NewUser = {
      id: generateIdFromEntropySize(10),
      username,
      email,
      passwordHash,
      role,
    };

    await db.insert(users).values(newUser);
    revalidatePath("/admin");
    return { success: true, message: "User created" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// Type for tracking uploaded resources that might need cleanup
interface UploadedResources {
  s3Objects: { bucket: string; key: string }[];
}

export async function createAvatar(prevState: any, formData: FormData) {
  const parsedData = avatarSchema.safeParse({
    avatarName: formData.get("avatarName"),
    imageFile: formData.get("imageFile"),
    voiceFiles: formData.getAll("voiceFiles"),
    userIds: formData.getAll("userIds"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarName, voiceFiles, imageFile, userIds } = parsedData.data;
  console.log(userIds);

  const uploadedResources: UploadedResources = {
    s3Objects: [],
  };

  const s3BucketName = process.env.AWS_BUCKET_NAME;
  if (!s3BucketName) {
    return { success: false, message: "S3 bucket not configured" };
  }

  try {
    // Create voice if voice files exist
    const elevenlabsRes =
      voiceFiles.length > 0
        ? await elevenlabs.voices.add({ name: avatarName, files: voiceFiles })
        : null;

    // Step 1: Upload initial image
    const sanitizedAvatarName = sanitizeString(avatarName);
    const sanitizedFileName = sanitizeFilename(imageFile.name);
    const fileName = `${sanitizedAvatarName}-${sanitizedFileName}`;
    const { url: imageUrl, key: imageKey } = await uploadToS3(
      imageFile.stream(),
      "avatars/",
      `${fileName}`,
      imageFile.type
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

    TODO: "5.1 and 5.2 are temp, should switch to transaction";
    // 5.1. Insert the new avatar
    const createdAvatar = await db
      .insert(avatars)
      .values({
        avatarName,
        imageUrl,
        idleVideoUrl: idleVideoUrl,
        elevenlabsVoiceId: elevenlabsRes?.voice_id || null,
      })
      .returning();
    // 5.2. Insert associations into users_to_avatars
    const associations = userIds.map((userId) => ({
      userId,
      avatarId: createdAvatar[0].id,
    }));

    await db.insert(usersToAvatars).values(associations);
    revalidatePath("/admin");
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
