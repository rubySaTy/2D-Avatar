"use server";

import { revalidatePath } from "next/cache";
import { generateIdFromEntropySize } from "lucia";
import * as argon2 from "argon2";
import { db } from "@/lib/db/db";
import { users, type NewUser, sessions } from "@/lib/db/schema";
import {
  createClonedVoiceSchema,
  createUserSchema,
  editUserSchema,
  updateCreditsSchema,
  userIdSchema,
} from "@/lib/validationSchema";
import { eq } from "drizzle-orm";
import { isDbError } from "@/lib/typeGuards";
import {
  findUserByUsernameOrEmail,
  updateUserCredits,
  updateManyAvatars,
} from "@/services";
import elevenlabs from "@/lib/integrations/elevenlabs";

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
    const existingUser = await db.select().from(users).where(eq(users.id, userId));

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

export async function uploadClonedVoice(prevState: any, formData: FormData) {
  const parseResult = createClonedVoiceSchema.safeParse({
    voiceName: formData.get("voice-name"),
    voiceFiles: formData.getAll("voice-files"),
    removeBackgroundNoise: formData.get("remove-background-noise") === "on",
    // description: formData.get("description"),
    associatedAvatarsIds: formData.getAll("associated-avatars-ids"),
  });

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const {
    voiceName,
    voiceFiles,
    removeBackgroundNoise,
    // description,
    associatedAvatarsIds,
  } = parseResult.data;

  try {
    const elevenlabsRes = await elevenlabs.voices.add({
      name: voiceName,
      files: voiceFiles,
      remove_background_noise: removeBackgroundNoise,
      // description, // TODO: causes bug?
    });

    await updateManyAvatars(associatedAvatarsIds, {
      elevenlabsClonedVoiceId: elevenlabsRes.voice_id,
    });

    return { success: true, message: "Voice created successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
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
