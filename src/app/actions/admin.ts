"use server";

import { revalidatePath } from "next/cache";
import {
  createAvatarSchema,
  createClonedVoiceSchema,
  createUserSchema,
  editAvatarSchema,
  editUserSchema,
  updateCreditsSchema,
  userIdSchema,
} from "@/lib/validationSchema";
import { isDbError } from "@/lib/typeGuards";
import {
  findUserByUsernameOrEmail,
  updateUserCredits,
  updateManyAvatars,
  createUserInDB,
  editUserInDB,
  getUserByID,
  deleteUserById,
  getAvatarById,
  editAvatarData,
  createAvatarData,
} from "@/services";
import elevenlabs from "@/lib/integrations/elevenlabs";
import { getUser, validateRequest } from "@/lib/auth";
import { isValidFileUpload } from "@/lib/utils";

async function isAdmin() {
  const { user } = await validateRequest();
  return user && user.role === "admin";
}
const unauthorized = { success: false, message: "Unauthorized" };

export async function createUserAction(prevState: any, formData: FormData) {
  if (!(await isAdmin())) return unauthorized;

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

    await createUserInDB(username, email, password, role);
    revalidatePath("/admin");
    return { success: true, message: "User created" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function editUserAction(prevState: any, formData: FormData) {
  if (!(await isAdmin())) return unauthorized;

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
    const existingUser = await getUserByID(userId);
    if (!existingUser) return { success: false, message: "User not found." };

    await editUserInDB(existingUser, username, email, role);
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

export async function deleteUserAction(formData: FormData) {
  if (!(await isAdmin())) return;

  const parseResult = userIdSchema.safeParse(formData.get("id"));

  if (!parseResult.success) {
    console.error(parseResult.error);
    return;
  }

  try {
    await deleteUserById(parseResult.data);
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

export async function uploadClonedVoice(prevState: any, formData: FormData) {
  if (!(await isAdmin())) return unauthorized;

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
  if (!(await isAdmin())) return unauthorized;

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

export async function createAvatarAdminAction(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== "admin") return unauthorized;

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
    await createAvatarData(avatarName, imageFile, associatedUsersIds, currentUser.id);
    revalidatePath("/admin");
    revalidatePath("/therapist");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function editAvatarAdminAction(prevState: any, formData: FormData) {
  if (!(await isAdmin())) return unauthorized;

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

  const { avatarId, avatarName, imageFile, associatedUsersIds } = parsedData.data;

  try {
    // TODO: move to avatar service layer
    const existingAvatar = await getAvatarById(avatarId);
    if (!existingAvatar) {
      console.error("Avatar not found in DB");
      return { success: false, message: "Avatar not found" };
    }

    await editAvatarData(
      existingAvatar,
      avatarId,
      avatarName,
      imageFile,
      associatedUsersIds
    );
    revalidatePath("/admin");
    return { success: true, message: "Avatar updated" };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}
