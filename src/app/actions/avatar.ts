"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { isValidFileUpload } from "@/lib/utils";
import {
  createAvatarSchema,
  editAvatarSchema,
  avatarIdSchema,
} from "@/lib/validationSchema";
import {
  createAvatarData,
  editAvatarData,
  getAvatarById,
  removeAvatar,
} from "@/services";

export async function createAvatarTherapist(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "Unauthorized" };

  const parsedData = createAvatarSchema.safeParse({
    avatarName: formData.get("avatar-name"),
    imageFile: formData.get("image-file"),
    uploaderId: currentUser.id,
    associatedUsersIds: [currentUser.id],
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarName, imageFile, associatedUsersIds, uploaderId } = parsedData.data;

  try {
    await createAvatarData(avatarName, imageFile, associatedUsersIds, uploaderId);
    revalidatePath("/admin");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function editAvatarTherapist(prevState: any, formData: FormData) {
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

export async function createAvatarAdmin(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== "admin")
    return { success: false, message: "Unauthorized" };

  const parsedData = createAvatarSchema.safeParse({
    avatarName: formData.get("avatar-name"),
    imageFile: formData.get("image-file"),
    uploaderId: currentUser.id,
    associatedUsersIds: formData.getAll("associated-users-ids"),
  });

  if (!parsedData.success) {
    const errors = parsedData.error.errors.map((err) => err.message).join(", ");
    return { success: false, message: `Validation failed: ${errors}` };
  }

  const { avatarName, imageFile, associatedUsersIds, uploaderId } = parsedData.data;

  try {
    await createAvatarData(avatarName, imageFile, associatedUsersIds, uploaderId);
    revalidatePath("/admin");
    return { success: true, message: "Avatar created" };
  } catch (error) {
    console.error("Error creating avatar:", error);
    return { success: false, message: "Internal server error" };
  }
}

export async function editAvatarAdmin(prevState: any, formData: FormData) {
  const currentUser = await getUser();
  if (!currentUser || currentUser.role !== "admin")
    return { success: false, message: "Unauthorized" };

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

export async function deleteAvatar(formData: FormData) {
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
