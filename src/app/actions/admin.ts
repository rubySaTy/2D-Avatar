"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { generateIdFromEntropySize } from "lucia";
import axios from "axios";
import * as argon2 from "argon2";
import { db } from "@/lib/db/db";
import {
  users,
  NewUser,
  avatars,
  usersToAvatars,
  sessions,
} from "@/lib/db/schema";
import {
  createIdleVideo,
  deleteS3Objects,
  findUser,
  getIdleVideo,
  uploadToS3,
} from "@/lib/utils.server";
import {
  avatarSchema,
  createUserSchema,
  editUserSchema,
} from "@/lib/validationSchema";
import { z } from "zod";
import { eq } from "drizzle-orm";
import elevenlabs from "@/lib/elevenlabs";
import { sanitizeString, sanitizeFilename } from "@/lib/utils";
import { isDbError } from "@/lib/typeGuards";

const userIdSchema = z.string().min(1, { message: "User ID cannot be empty." });
const avatarIdSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
}, z.number().min(1, { message: "Avatar ID must be a positive number." }));

export async function deleteUser(userId: string) {
  const parseResult = userIdSchema.safeParse(userId);

  if (!parseResult.success) {
    console.error(parseResult.error.errors);
    return;
  }

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

export async function editUser(
  userId: string,
  prevState: any,
  formData: FormData
) {
  const parseUserId = userIdSchema.safeParse(userId);

  if (!parseUserId.success) {
    console.error(parseUserId.error.errors);
    return { success: false, message: "Invalid user ID" };
  }

  const parseResult = editUserSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const { username, email, role } = parseResult.data;
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (existingUser.length === 0) {
      return { success: false, message: "User not found." };
    }

    const user = existingUser[0];
    const roleChanged = user.role !== role && role;

    const updatedUser: Partial<NewUser> = {
      username,
      email,
    };

    if (roleChanged) {
      updatedUser.role = role;
    }
    console.log(updatedUser);

    await db.update(users).set(updatedUser).where(eq(users.id, userId));

    // If role has changed, invalidate all active sessions for the user
    if (roleChanged) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }

    revalidatePath("/admin");
    return { success: true, message: "User updated successfully." };
  } catch (error) {
    console.error(error);

    // Simple type guard to check if error is a DbError
    if (isDbError(error)) {
      if (error.code === "23505") {
        // PostgreSQL unique_violation error code
        if (error.constraint === "user_username_unique")
          return { success: false, message: "Username already exists." };
        if (error.constraint === "user_email_unique")
          return { success: false, message: "Email already exists." };
      }
    }

    return { success: false, message: "An unexpected error occurred" };
  }
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

  TODO: "Sanitize voice files";
  const sanitizedAvatarName = sanitizeString(avatarName);
  const sanitizedFileName = sanitizeFilename(imageFile.name);

  try {
    // Step 1: Create Voice - if voice files exist
    const elevenlabsRes =
      voiceFiles.length > 0
        ? await elevenlabs.voices.add({ name: avatarName, files: voiceFiles })
        : null;

    // Step 2: Upload Image to S3
    const fileName = `${sanitizedAvatarName}-${sanitizedFileName}`;
    const { url: imageUrl, key: imageKey } = await uploadToS3(
      imageFile.stream(),
      "avatars/",
      `${fileName}`,
      imageFile.type
    );

    // Step 3: Create idle video
    const createdIdleVideoRes = await createIdleVideo(imageUrl);
    if (!createdIdleVideoRes) {
      return { success: false, message: "Error creating idle video" };
    }

    // Step 4: Poll for idle video completion
    // Polling to get the silent idle video
    const idleVideo = await getIdleVideo(createdIdleVideoRes.id);
    if (!idleVideo) {
      return { success: false, message: "Error fetching idle video" };
    }

    // Step 5: Download and upload final video
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

    // Step 6: Begin Database Transaction for Insert Operations
    await db.transaction(async (tx) => {
      const createdAvatar = await tx
        .insert(avatars)
        .values({
          avatarName,
          imageUrl,
          imageKey,
          idleVideoUrl,
          idleVideoKey,
          elevenlabsVoiceId: elevenlabsRes?.voice_id || null,
        })
        .returning();

      const associations = userIds.map((userId) => ({
        userId,
        avatarId: createdAvatar[0].id,
      }));

      await tx.insert(usersToAvatars).values(associations);
    });

    revalidatePath("/admin");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function deleteAvatar(formData: FormData) {
  const id = formData.get("id");
  const parseResult = avatarIdSchema.safeParse(id);

  if (!parseResult.success) {
    console.error(parseResult.error.errors);
    return;
  }

  const avatarId = parseResult.data;
  try {
    const deletedAvatar = await db
      .delete(avatars)
      .where(eq(avatars.id, avatarId))
      .returning();

    const { imageKey, idleVideoKey } = deletedAvatar[0];

    const keysToDelete: string[] = [];
    keysToDelete.push(imageKey);
    if (idleVideoKey) keysToDelete.push(idleVideoKey);
    await deleteS3Objects(keysToDelete);

    revalidatePath("/admin");
  } catch (error) {
    console.error("Error deleting avatar:", error);
  }
}
