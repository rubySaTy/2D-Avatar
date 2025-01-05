"use server";

import { revalidatePath } from "next/cache";
import axios from "axios";
import { getUser } from "@/lib/auth";
import { isValidFileUpload } from "@/lib/utils";
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
  removeAvatar,
} from "@/services";
import { openAI } from "@/lib/integrations/openai";

export async function createAvatarTherapistAction(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const parsedData = createAvatarSchema.safeParse({
    avatarName: formData.get("avatar-name"),
    imageFile: formData.get("image-file"),
    associatedUsersIds: [currentUser.id],
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

export async function editAvatarTherapistAction(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const image = formData.get("image-file") as File;
  const parsedData = editAvatarSchema.safeParse({
    avatarId: formData.get("avatar-id"),
    avatarName: formData.get("avatar-name"),
    imageFile: isValidFileUpload(image) ? image : undefined,
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarId, avatarName, imageFile } = parsedData.data;

  try {
    // TODO: move to avatar service layer
    const existingAvatar = await getAvatarById(avatarId);
    if (!existingAvatar) {
      console.error("Avatar not found in DB");
      return { success: false, message: "Avatar not found" };
    }

    if (existingAvatar.uploaderId !== currentUser.id)
      return { success: false, message: "Unauthorized" };

    await editAvatarData(existingAvatar, avatarId, avatarName, imageFile);
    revalidatePath("/admin");
    return { success: true, message: "Avatar updated" };
  } catch (error) {
    console.error("Error updating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function deleteAvatarAction(formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser) return;

  const id = formData.get("id");
  const parseResult = avatarIdSchema.safeParse(id);

  if (!parseResult.success) {
    console.error(parseResult.error.errors);
    return;
  }

  try {
    const existingAvatar = await getAvatarById(parseResult.data);
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

export async function generateAIAvatarAction(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const res = generateLLMAvatarSchema.safeParse({
    prompt: formData.get("prompt"),
  });

  if (!res.success) {
    const errors = res.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { prompt } = res.data;
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
      payload: formData,
      data: response.data,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error generating avatar" };
  }
}

export async function generateAIAvatarWithImageAction(
  prevState: any,
  formData: FormData
) {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const res = generateLLMAvatarWithImageSchema.safeParse({
    prompt: formData.get("prompt"),
    imageFile: formData.get("image-file"),
  });

  if (!res.success) {
    const errors = res.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { prompt, imageFile } = res.data;
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
      payload: formData,
      data: response.data,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error generating avatar" };
  }
}

export async function createAIAvatarAction(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const res = CreateLLMGeneratedAvatarSchema.safeParse({
    avatarName: formData.get("avatar-name"),
    imageUrl: formData.get("image-url"),
  });

  if (!res.success) {
    const errors = res.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarName, imageUrl } = res.data;

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
    return { success: false, message: "Internal server error" };
  }
}
