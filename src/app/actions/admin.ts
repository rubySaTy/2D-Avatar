"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
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
  createUser,
  editUser,
} from "@/services";
import elevenlabs from "@/lib/integrations/elevenlabs";

export async function createUserAction(prevState: any, formData: FormData) {
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

  // TODO: move to service layer
  try {
    const foundUser = await findUserByUsernameOrEmail(username, email);
    if (foundUser) {
      const conflicts: string[] = [];

      if (foundUser.username === username) conflicts.push("Username already exists.");
      if (foundUser.email === email) conflicts.push("Email already exists.");

      const conflictMessage =
        conflicts.length > 1
          ? conflicts.join(" ")
          : conflicts[0] || "User already exists.";

      return { success: false, message: conflictMessage };
    }

    await createUser(username, email, password, role);
    revalidatePath("/admin");
    return { success: true, message: "User created" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function editUserAction(prevState: any, formData: FormData) {
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
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) return { success: false, message: "User not found." };

    await editUser(existingUser, username, email, role);
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
