"use server";

import { revalidatePath } from "next/cache";
import { generateIdFromEntropySize } from "lucia";
import * as argon2 from "argon2";
import { db } from "@/lib/db/db";
import {
  users,
  type NewUser,
  avatars,
  usersToAvatars,
  sessions,
  type NewAvatar,
} from "@/lib/db/schema";
import {
  avatarIdSchema,
  createAvatarSchema,
  createClonedVoiceSchema,
  createUserSchema,
  editAvatarSchema,
  editUserSchema,
  updateCreditsSchema,
  userIdSchema,
} from "@/lib/validationSchema";
import { eq } from "drizzle-orm";
import { isValidFileUpload, sanitizeFileObjects } from "@/lib/utils";
import { isDbError } from "@/lib/typeGuards";
import {
  deleteS3Objects,
  findUserByUsernameOrEmail,
  updateUserCredits,
  addAvatar,
  getAvatarById,
  processAvatarAndVideo,
  addVoice,
} from "@/services";
import { redis } from "@/lib/redis";

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
    const foundUser = await findUserByUsernameOrEmail(username, email);
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
    userId: formData.get("user-id"),
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

export async function addClonedVoice(prevState: any, formData: FormData) {
  const parseResult = createClonedVoiceSchema.safeParse({
    voiceName: formData.get("voice-name"),
    voiceFiles: formData.getAll("voice-files"),
    removeBackgroundNoises: formData.get("remove-background-noises"),
    description: formData.get("description"),
  });

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const { voiceName, voiceFiles, removeBackgroundNoises, description } =
    parseResult.data;

  console.log(voiceName, voiceFiles, removeBackgroundNoises, description);
  return { success: true, message: "Test message." };
  // const elevenlabsRes = addVoice(
  //   voiceName,
  //   voiceFiles,
  //   description,
  //   removeBackgroundNoises
  // );
}

export async function createAvatar(prevState: any, formData: FormData) {
  const parsedData = createAvatarSchema.safeParse({
    avatarName: formData.get("avatar-name"),
    imageFile: formData.get("image-file"),
    associatedUsersIds: formData.getAll("associated-users-ids"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarName, imageFile, associatedUsersIds } = parsedData.data;

  try {
    const { imageUrl, imageKey, createdIdleVideoRes } =
      await processAvatarAndVideo(avatarName, imageFile);

    if (!createdIdleVideoRes)
      return { success: false, message: "Error creating idle video" };

    const newAvatar: NewAvatar = {
      avatarName,
      imageKey,
      imageUrl,
    };

    const createdAvatarId = await addAvatar(newAvatar, associatedUsersIds);
    redis.set(createdIdleVideoRes.id, createdAvatarId, { ex: 300 });

    revalidatePath("/admin");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function editAvatar(prevState: any, formData: FormData) {
  const image = formData.get("image-file") as File;
  const parsedData = editAvatarSchema.safeParse({
    avatarId: formData.get("avatar-id"),
    avatarName: formData.get("avatar-name"),
    imageFile: isValidFileUpload(image) ? image : undefined,
    associatedUsersIds: formData.getAll("associated-users-ids"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarId, avatarName, imageFile, associatedUsersIds } =
    parsedData.data;

  try {
    const existingAvatar = await getAvatarById(avatarId);
    if (!existingAvatar) {
      return { success: false, message: "Avatar not found" };
    }
    // Prepare files to delete
    const filesToDelete: string[] = [];

    const updateData: Partial<NewAvatar> = {
      avatarName,
    };

    if (imageFile && imageFile.size > 0) {
      const { imageKey, imageUrl, createdIdleVideoRes } =
        await processAvatarAndVideo(avatarName, imageFile);

      if (!createdIdleVideoRes)
        return { success: false, message: "Error creating idle video" };

      updateData.imageKey = imageKey;
      updateData.imageUrl = imageUrl;

      // Mark old files for deletion
      if (existingAvatar.imageKey) filesToDelete.push(existingAvatar.imageKey);
      if (existingAvatar.idleVideoKey)
        filesToDelete.push(existingAvatar.idleVideoKey);

      redis.set(createdIdleVideoRes.id, existingAvatar.id, { ex: 300 });
    }

    await db.transaction(async (tx) => {
      await tx.update(avatars).set(updateData).where(eq(avatars.id, avatarId));

      const existingAssociations = await tx
        .select({ userId: usersToAvatars.userId })
        .from(usersToAvatars)
        .where(eq(usersToAvatars.avatarId, avatarId));

      const existingUserIds = existingAssociations.map((assoc) => assoc.userId);

      if (
        existingUserIds.length !== associatedUsersIds.length ||
        !associatedUsersIds.every((userId) => existingUserIds.includes(userId))
      ) {
        // Delete existing user associations
        await tx
          .delete(usersToAvatars)
          .where(eq(usersToAvatars.avatarId, avatarId));

        // Insert new user associations (if any)
        const associations = associatedUsersIds.map((userId) => ({
          userId,
          avatarId,
        }));

        if (associations.length > 0)
          await tx.insert(usersToAvatars).values(associations);
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

export async function handleUpdateCredits(prevState: any, formData: FormData) {
  const parseResult = updateCreditsSchema.safeParse({
    userId: formData.get("user-id"),
    amount: Number(formData.get("amount")),
    reason: formData.get("reason"),
  });

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const { userId, amount, reason } = parseResult.data;

  try {
    await updateUserCredits(userId, amount, reason);

    // TODO: "Use revalidateTag when upgrading to NextJS 15,";
    revalidatePath("/admin");

    return { success: true, message: "Credits updated successfully." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
