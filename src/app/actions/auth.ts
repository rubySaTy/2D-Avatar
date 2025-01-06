"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lucia } from "@/auth";
import * as argon2 from "argon2"; // downgraded version because of an error with vercel - https://github.com/vercel/next.js/discussions/65978
import crypto from "crypto";

import {
  forgotPasswordSchema,
  loginUserSchema,
  resetPasswordSchema,
} from "@/lib/validationSchema";
import { validateRequest } from "@/lib/auth";
import {
  clearResetToken,
  findUserByEmail,
  findUserByResetToken,
  findUserByUsernameOrEmail,
  setResetToken,
  updateUserPassword,
} from "@/services";
import { sendPasswordResetEmail } from "@/lib/integrations/resend";
import type { ActionResponse } from "@/lib/types";

interface LoginFormData {
  identifier: string;
  password: string;
}

export async function loginUser(
  _: any,
  formData: FormData
): Promise<ActionResponse<LoginFormData>> {
  const { session } = await validateRequest();
  if (session) return { success: false, message: "Already logged in" };

  const rawData = {
    identifier: formData.get("identifier") as string,
    password: formData.get("password") as string,
  };
  const parsedResult = loginUserSchema.safeParse(rawData);

  if (!parsedResult.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedResult.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { identifier, password } = parsedResult.data;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    const user = await findUserByUsernameOrEmail(
      isEmail ? undefined : identifier,
      isEmail ? identifier : undefined
    );

    if (!user) return { success: false, message: "Invalid credentials", inputs: rawData };

    const isValidPassword = await argon2.verify(user.passwordHash, password);
    if (!isValidPassword)
      return { success: false, message: "Invalid credentials", inputs: rawData };

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred", inputs: rawData };
  }
}

export async function logout() {
  const { session } = await validateRequest();
  if (!session) return { message: "Unauthorized" };

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  redirect("/login");
}

export async function sendResetLink(
  _: any,
  formData: FormData
): Promise<ActionResponse<{ email: string }>> {
  const emailInput = formData.get("email") as string;
  const parsedResult = forgotPasswordSchema.safeParse({ email: emailInput });

  if (!parsedResult.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedResult.error.flatten().fieldErrors,
      inputs: { email: emailInput },
    };
  }

  const { email } = parsedResult.data;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      // Keep silent for security: don't reveal user existence
      return {
        success: true,
        message: "If an account exists, a reset link was sent.",
      };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry
    await setResetToken(email, token, expires);

    const res = await sendPasswordResetEmail(email, token);
    if (!res)
      return { success: false, message: "Failed to send email", inputs: { email } };

    return {
      success: true,
      message: "If an account exists, a reset link was sent.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred", inputs: { email } };
  }
}

interface resetPasswordData {
  password: string;
  confirmPassword: string;
}

export async function resetPassword(
  _: any,
  formData: FormData
): Promise<ActionResponse<resetPasswordData>> {
  const rawData = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirm-password") as string,
    resetToken: formData.get("reset-token") as string,
  };

  const parsedResult = resetPasswordSchema.safeParse(rawData);

  if (!parsedResult.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: parsedResult.error.flatten().fieldErrors,
      inputs: rawData,
    };
  }

  const { password, resetToken } = parsedResult.data;

  try {
    const user = await findUserByResetToken(resetToken);
    if (!user)
      return {
        success: false,
        message:
          "The reset token is either invalid, expired, or already used. Please request a new password reset email.",
        inputs: rawData,
      };

    const hashedPassword = await argon2.hash(password);
    await updateUserPassword(user.id, hashedPassword);
    await clearResetToken(user.id);
    return { success: true, message: "Password reset was successful" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred", inputs: rawData };
  }
}
