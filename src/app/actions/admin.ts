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
  avatarIdSchema,
  createAvatarSchema,
  createUserSchema,
  editAvatarSchema,
  editUserSchema,
  userIdSchema,
} from "@/lib/validationSchema";
import { eq } from "drizzle-orm";
import elevenlabs from "@/lib/elevenlabs";
import { sanitizeString, sanitizeFilename } from "@/lib/utils";
import { isDbError } from "@/lib/typeGuards";
import {
  uploadToS3,
  createIdleVideo,
  getIdleVideo,
  deleteS3Objects,
  findUser,
} from "@/services";

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
    if (foundUser) {
      const conflicts: string[] = [];

      if (foundUser.username === username) {
        conflicts.push("Username already exists.");
      }

      if (foundUser.email === email) {
        conflicts.push("Email already exists.");
      }

      const conflictMessage =
        conflicts.length > 1
          ? conflicts.join(" ")
          : conflicts[0] || "User already exists.";

      return { success: false, message: conflictMessage };
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

export async function editUser(prevState: any, formData: FormData) {
  const parseResult = editUserSchema.safeParse({
    userId: formData.get("userId"),
    username: formData.get("username"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const { userId, username, email, role } = parseResult.data;

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (existingUser.length === 0) {
      return { success: false, message: "User not found." };
    }

    const user = existingUser[0];
    const updates: Partial<NewUser> = { username, email };
    const roleChanged = role && user.role !== role;

    if (roleChanged) updates.role = role;

    await db.update(users).set(updates).where(eq(users.id, userId));

    if (roleChanged) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    }

    revalidatePath("/admin");
    return { success: true, message: "User updated successfully." };
  } catch (error) {
    console.error(error);

    // Simple type guard to check if error is a DbError
    if (isDbError(error) && error.code === "23505") {
      const constraintMessages: Record<string, string> = {
        user_username_unique: "Username already exists.",
        user_email_unique: "Email already exists.",
      };
      return {
        success: false,
        message: constraintMessages[error.constraint] || "Duplicate entry.",
      };
    }

    return { success: false, message: "An unexpected error occurred" };
  }
}

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

export async function createAvatar(prevState: any, formData: FormData) {
  const parsedData = createAvatarSchema.safeParse({
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

export async function editAvatar(prevState: any, formData: FormData) {
  const parsedData = editAvatarSchema.safeParse({
    avatarId: formData.get("avatarId"),
    avatarName: formData.get("avatarName"),
    imageFile: formData.get("imageFile"),
    userIds: formData.getAll("userIds"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarId, avatarName, imageFile, userIds } = parsedData.data;

  try {
    const existingAvatar = await db.query.avatars.findFirst({
      where: eq(avatars.id, avatarId),
    });

    if (!existingAvatar) {
      return { success: false, message: "Avatar not found" };
    }

    // Prepare update object
    const updateData: Partial<typeof avatars.$inferInsert> = {
      avatarName,
    };

    // Prepare files to delete (if any)
    const filesToDelete: string[] = [];

    // Check if image is being updated
    let imageUrl = existingAvatar.imageUrl;
    let imageKey = existingAvatar.imageKey;
    let idleVideoUrl = existingAvatar.idleVideoUrl;
    let idleVideoKey = existingAvatar.idleVideoKey;

    if (imageFile && imageFile.size > 0) {
      // Image is being updated
      const sanitizedAvatarName = sanitizeString(avatarName);
      const sanitizedFileName = sanitizeFilename(imageFile.name);
      const fileName = `${sanitizedAvatarName}-${sanitizedFileName}`;

      // Upload new image
      const newImageUpload = await uploadToS3(
        imageFile.stream(),
        "avatars/",
        `${fileName}`,
        imageFile.type
      );

      // Update image details
      imageUrl = newImageUpload.url;
      imageKey = newImageUpload.key;

      // Create new idle video
      const createdIdleVideoRes = await createIdleVideo(imageUrl);
      if (!createdIdleVideoRes) {
        return { success: false, message: "Error creating idle video" };
      }

      // Poll for idle video completion
      const idleVideo = await getIdleVideo(createdIdleVideoRes.id);
      if (!idleVideo) {
        return { success: false, message: "Error fetching idle video" };
      }

      // Download and upload final video
      const res = await axios.get(idleVideo.result_url, {
        responseType: "arraybuffer",
      });
      const videoBuffer = Buffer.from(res.data, "binary");

      const uniqueId = randomUUID();
      const videoFileName = `${uniqueId}.mp4`;
      const newVideoUpload = await uploadToS3(
        videoBuffer,
        "videos/",
        videoFileName,
        "video/mp4"
      );

      // Update video details
      idleVideoUrl = newVideoUpload.url;
      idleVideoKey = newVideoUpload.key;

      // Mark old files for deletion
      if (existingAvatar.imageKey) filesToDelete.push(existingAvatar.imageKey);
      if (existingAvatar.idleVideoKey)
        filesToDelete.push(existingAvatar.idleVideoKey);
    }

    // Prepare update data with new or existing values
    updateData.imageUrl = imageUrl;
    updateData.imageKey = imageKey;
    updateData.idleVideoUrl = idleVideoUrl;
    updateData.idleVideoKey = idleVideoKey;

    // Database Transaction
    await db.transaction(async (tx) => {
      await tx.update(avatars).set(updateData).where(eq(avatars.id, avatarId));

      const existingAssociations = await tx
        .select({ userId: usersToAvatars.userId })
        .from(usersToAvatars)
        .where(eq(usersToAvatars.avatarId, avatarId));

      const existingUserIds = existingAssociations.map((assoc) => assoc.userId);

      if (
        existingUserIds.length !== userIds.length ||
        !userIds.every((userId) => existingUserIds.includes(userId))
      ) {
        // Delete existing user associations
        await tx
          .delete(usersToAvatars)
          .where(eq(usersToAvatars.avatarId, avatarId));

        // Insert new user associations (if any)
        const associations = userIds.map((userId) => ({
          userId,
          avatarId,
        }));

        if (associations.length > 0) {
          await tx.insert(usersToAvatars).values(associations);
        }
      }
    });

    // Delete old S3 files after successful upload and database transaction
    if (filesToDelete.length > 0) {
      await deleteS3Objects(filesToDelete);
    }

    revalidatePath("/admin");
    return { success: true, message: "Avatar updated" };
  } catch (error) {
    console.error("Error updating avatar:", error);
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
