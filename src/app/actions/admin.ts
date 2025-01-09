"use server";

import { revalidatePath } from "next/cache";
import {
  createAvatarSchema,
  createClonedVoiceSchema,
  createUserSchema,
  editAvatarSchema,
  editUserSchema,
  updateCreditsSchema,
} from "@/lib/validationSchema";
import { isDbError } from "@/lib/typeGuards";
import {
  findUserByUsernameOrEmail,
  updateUserCredits,
  updateManyAvatars,
  createUserInDB,
  updateUserInDB,
  getUserByID,
  getAvatarById,
  editAvatarData,
  createAvatarData,
} from "@/services";
import elevenlabs from "@/lib/integrations/elevenlabs";
import { getUser, validateRequest } from "@/lib/auth";
import { isValidFileUpload } from "@/lib/utils";
import type { ActionResponse, BaseAvatarFormData, BaseUserFormData } from "@/lib/types";

async function isAdmin() {
  const { user } = await validateRequest();
  return user && user.role === "admin";
}
const unauthorized = { success: false, message: "Unauthorized" };

export async function createUserAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<BaseUserFormData>> {
  if (!(await isAdmin())) return unauthorized;

  const rawData = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const parsedData = createUserSchema.safeParse(rawData);

  if (!parsedData.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { username, email, password, role } = parsedData.data;

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

      return { success: false, message: conflictMessage, inputs: rawData };
    }

    await createUserInDB(username, email, password, role);
    revalidatePath("/admin");
    return { success: true, message: "User created" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred", inputs: rawData };
  }
}

export async function editUserAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<BaseUserFormData>> {
  if (!(await isAdmin())) return unauthorized;

  const rawData = {
    userId: formData.get("user-id") as string,
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as string,
  };

  const parsedData = editUserSchema.safeParse(rawData);

  if (!parsedData.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { userId, username, email, role } = parsedData.data;

  try {
    const existingUser = await getUserByID(userId);
    if (!existingUser)
      return { success: false, message: "User not found.", inputs: rawData };

    await updateUserInDB(existingUser, username, email, role);
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
        inputs: rawData,
      };
    }

    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function uploadClonedVoice(prevState: any, formData: FormData) {
  if (!(await isAdmin())) return unauthorized;

  const parsedData = createClonedVoiceSchema.safeParse({
    voiceName: formData.get("voice-name"),
    voiceFiles: formData.getAll("voice-files"),
    removeBackgroundNoise: formData.get("remove-background-noise") === "on",
    // description: formData.get("description"),
    associatedAvatarsIds: formData.getAll("associated-avatars-ids"),
  });

  if (!parsedData.success) {
    const errorMessages = parsedData.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const {
    voiceName,
    voiceFiles,
    removeBackgroundNoise,
    // description,
    associatedAvatarsIds,
  } = parsedData.data;

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

  const parsedData = updateCreditsSchema.safeParse({
    userId: formData.get("user-id"),
    amount: Number(formData.get("amount")),
    reason: formData.get("reason"),
  });

  if (!parsedData.success) {
    const errorMessages = parsedData.error.errors.map((err) => err.message);
    return { success: false, message: errorMessages.join(", ") };
  }

  const { userId, amount, reason } = parsedData.data;

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

export async function createAvatarAdminAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<BaseAvatarFormData>> {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== "admin") return unauthorized;

  const rawData = {
    avatarName: formData.get("avatar-name") as string,
    imageFile: formData.get("image-file") as File,
    associatedUsersIds: formData.getAll("associated-users-ids") as string[],
  };

  const parsedData = createAvatarSchema.safeParse(rawData);

  if (!parsedData.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { avatarName, imageFile, associatedUsersIds } = parsedData.data;

  try {
    await createAvatarData(avatarName, imageFile, associatedUsersIds, currentUser.id);
    revalidatePath("/admin");
    revalidatePath("/therapist");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error", inputs: rawData };
  }
}

export async function editAvatarAdminAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<BaseAvatarFormData>> {
  if (!(await isAdmin())) return unauthorized;

  const image = formData.get("image-file") as File;
  const rawData = {
    avatarId: formData.get("avatar-id") as string,
    avatarName: formData.get("avatar-name") as string,
    imageFile: isValidFileUpload(image) ? image : undefined,
    associatedUsersIds: formData.getAll("associated-users-ids") as string[],
  };

  const parsedData = editAvatarSchema.safeParse(rawData);

  if (!parsedData.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
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
    return { success: false, message: "Internal server error", inputs: rawData };
  }
}
