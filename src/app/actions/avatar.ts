"use server";

import { revalidatePath } from "next/cache";
import axios from "axios";
import { getUser, validateRequest } from "@/lib/auth";
import {
  createAvatarSchema,
  editAvatarSchema,
  avatarIdSchema,
  generateLLMAvatarSchema,
  CreateLLMGeneratedAvatarSchema,
  generateLLMAvatarWithImageSchema,
} from "@/lib/validationSchema";
import {
  createAvatarData,
  editAvatarData,
  getAvatarById,
  getAvatarWithAssociatedUsersId,
  removeAvatar,
} from "@/services";
import { openAI } from "@/lib/integrations/openai";
import type {
  ActionResponse,
  BaseAvatarFormData,
  CreateAIAvatarFormData,
  GenerateAIAvatarActionResponse,
} from "@/lib/types";

export async function createAvatarAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<BaseAvatarFormData>> {
  const { user } = await validateRequest();
  if (!user) return { success: false, message: "Unauthorized" };
  if (user.role !== "therapist" && user.role !== "admin") throw new Error("invalid role");

  const usersIds = formData.getAll("associated-users-ids") as string[];
  const rawData = {
    avatarName: formData.get("avatar-name") as string,
    imageFile: formData.get("image-file") as File,
    associatedUsersIds: usersIds.length > 0 ? usersIds : [user.id],
  };

  const parsedData = createAvatarSchema.safeParse(rawData);

  if (!parsedData.success) {
    console.error(parsedData.error.errors);
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { avatarName, imageFile, associatedUsersIds } = parsedData.data;

  try {
    await createAvatarData(avatarName, imageFile, associatedUsersIds, user.id);
    revalidatePath("/admin");
    revalidatePath("/therapist");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error", inputs: rawData };
  }
}
export async function editAvatarAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<BaseAvatarFormData>> {
  const { user } = await validateRequest();
  if (!user) return { success: false, message: "Unauthorized" };
  if (user.role !== "therapist" && user.role !== "admin") throw new Error("invalid role");

  const rawData: any = {
    avatarId: formData.get("avatar-id") as string,
    avatarName: formData.get("avatar-name") as string,
    associatedUsersIds: formData.getAll("associated-users-ids") as string[] | undefined,
  };

  const parsedData = editAvatarSchema.safeParse(rawData);

  if (!parsedData.success) {
    console.error(parsedData.error.errors);
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { avatarId, avatarName, associatedUsersIds } = parsedData.data;

  try {
    const existingAvatar = await getAvatarWithAssociatedUsersId(avatarId);
    if (!existingAvatar) {
      console.error("Avatar not found in DB");
      return { success: false, message: "Avatar not found" };
    }

    if (user.role !== "admin" && existingAvatar.uploaderId !== user.id) {
      return { success: false, message: "Unauthorized" };
    }

    // If `associatedUsersIds` is provided and contains at least one element, use it.
    // otherwise, fall back to the `associatedUsersId` from the existing avatar.
    const updatedAssociatedUsersIds =
      associatedUsersIds && associatedUsersIds.length > 0
        ? associatedUsersIds
        : existingAvatar.associatedUsersId;

    editAvatarData(avatarId, avatarName, updatedAssociatedUsersIds);
    revalidatePath("/therapist");
    revalidatePath("/admin");
    return { success: true, message: "Avatar updated" };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, message: "Internal server error", inputs: rawData };
  }
}

export async function deleteAvatarAction(avatarId: number) {
  const currentUser = await getUser();
  if (!currentUser) return;

  const parsedData = avatarIdSchema.safeParse(avatarId);

  if (!parsedData.success) {
    console.error(parsedData.error.errors);
    return;
  }

  try {
    const existingAvatar = await getAvatarById(parsedData.data);
    if (!existingAvatar) {
      console.error("Avatar not found in DB");
      return;
    }

    if (existingAvatar.uploaderId !== currentUser.id && currentUser.role !== "admin") {
      console.error("User is Unauthorized to delete avatar");
      return;
    }

    await removeAvatar(existingAvatar.id);
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error deleting avatar:", error);
  }
}

export async function generateAIAvatarAction(
  _: any,
  formData: FormData
): Promise<GenerateAIAvatarActionResponse> {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const rawData = { prompt: formData.get("prompt") as string };
  const parsedData = generateLLMAvatarSchema.safeParse(rawData);

  if (!parsedData.success) {
    console.error(parsedData.error.errors);
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { prompt } = parsedData.data;
  try {
    const systemDirective =
      "Generate a centered, front-facing headshot. The subject's face should be fully visible, directly facing the camera, with even lighting and a neutral background.";

    const response = await openAI.images.generate({
      model: "dall-e-3",
      prompt: `${systemDirective} ${prompt}`,
      quality: "hd",
      n: 1,
      size: "1024x1024",
    });

    return {
      success: true,
      message: "Image Generated",
      inputs: rawData,
      payload: response.data,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error generating avatar", inputs: rawData };
  }
}

export async function generateAIAvatarWithImageAction(
  _: any,
  formData: FormData
): Promise<GenerateAIAvatarActionResponse> {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const rawData = {
    prompt: formData.get("prompt") as string,
    imageFile: formData.get("image-file") as File,
  };

  const parsedData = generateLLMAvatarWithImageSchema.safeParse(rawData);

  if (!parsedData.success) {
    console.error(parsedData.error.errors);
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { prompt, imageFile } = parsedData.data;
  try {
    const response = await openAI.images.edit({
      image: imageFile,
      prompt: `${prompt}`,
      n: 4,
      size: "1024x1024",
    });

    return {
      success: true,
      message: "Image Generated",
      inputs: rawData,
      payload: response.data,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error generating avatar", inputs: rawData };
  }
}

export async function createAIAvatarAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<CreateAIAvatarFormData>> {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const rawData = {
    avatarName: formData.get("avatar-name") as string,
    imageUrl: formData.get("image-url") as string,
  };
  const parsedData = CreateLLMGeneratedAvatarSchema.safeParse(rawData);

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return {
      success: false,
      message: errors,
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { avatarName, imageUrl } = parsedData.data;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data, "binary");
    const isPublicAvatar = true;

    await createAvatarData(
      avatarName,
      imageBuffer,
      [currentUser.id],
      currentUser.id,
      isPublicAvatar
    );
    revalidatePath("/admin");
    revalidatePath("/therapist");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error", inputs: rawData };
  }
}
