"use server";

import { revalidatePath } from "next/cache";
import { validateRequest } from "@/lib/auth";
import {
  changePasswordSchema,
  updateUserSchema,
  userIdSchema,
} from "@/lib/validationSchema";
import {
  deleteUserById,
  getUserByID,
  updateUserInDB,
  updateUserPassword,
  verifyUserPassword,
} from "@/services";
import { ActionResponse, ChangePasswordFormData } from "@/lib/types";
import { isDbError } from "@/lib/typeGuards";

export async function deleteUserAction(userId: string) {
  const { user } = await validateRequest();
  if (user && user.id !== userId && user.role !== "admin") return;

  const parsedData = userIdSchema.safeParse(userId);

  if (!parsedData.success) {
    console.error(parsedData.error);
    return;
  }

  try {
    await deleteUserById(parsedData.data);
    revalidatePath("/admin");
  } catch (error) {
    console.error("Error deleting user:", error);
  }
}

export async function changeUserPasswordAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<ChangePasswordFormData>> {
  const { user } = await validateRequest();
  if (!user) return { success: false, message: "Unauthorized" };

  const rawData = {
    currentPassword: formData.get("current-password") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirm-password") as string,
  };

  const parsedData = changePasswordSchema.safeParse(rawData);
  if (!parsedData.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { currentPassword, password } = parsedData.data;

  try {
    const currentUser = await getUserByID(user.id);
    if (!currentUser) throw new Error("User not found"); // Error because this shouldn't happen, because of the check at the start of the function

    // Check if the current password is correct
    const isValidPassword = await verifyUserPassword(
      currentUser.passwordHash,
      currentPassword
    );

    if (!isValidPassword)
      return { success: false, message: "Current Password is Invalid", inputs: rawData };

    // Update the user's password in the database
    await updateUserPassword(currentUser.id, password);

    return { success: true, message: "Password changed successfully." };
  } catch (error) {
    console.error("Error changing password:", error);
    return { success: false, message: "An unexpected error occurred.", inputs: rawData };
  }
}

export async function updateUserAction(
  _: any,
  formData: FormData
): Promise<ActionResponse<{ username: string; email: string }>> {
  const { user } = await validateRequest();
  if (!user) return { success: false, message: "Unauthorized" };

  const rawData = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
  };

  const parsedData = updateUserSchema.safeParse(rawData);
  if (!parsedData.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedData.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { email, username } = parsedData.data;
  try {
    const currentUser = await getUserByID(user.id);
    if (!currentUser) throw new Error("User not found"); // Error because this shouldn't happen, because of the check at the start of the function

    const updatedUser = await updateUserInDB(currentUser, username, email);
    const updatedInputs = {
      username: updatedUser.username,
      email: updatedUser.email,
    };
    return {
      success: true,
      message: "User updated successfully.",
      inputs: updatedInputs,
    };
  } catch (error) {
    console.error("Error updating user:", error);

    // Simple type guard to check if error is a DbError
    if (isDbError(error) && error.code === "23505") {
      const constraintMessages: Record<string, string> = {
        user_username_lower_unique: "Username already exists.",
        user_email_unique: "Email already exists.",
      };
      return {
        success: false,
        message: constraintMessages[error.constraint] || "Duplicate entry.",
        inputs: rawData,
      };
    }

    return { success: false, message: "An unexpected error occurred.", inputs: rawData };
  }
}
