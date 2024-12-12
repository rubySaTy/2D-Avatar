"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lucia } from "@/auth";
import * as argon2 from "argon2"; // downgraded version because of an error with vercel - https://github.com/vercel/next.js/discussions/65978
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
import { generateResetToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function loginUser(prevState: any, formData: FormData) {
  const parsedResult = loginUserSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsedResult.success) {
    const errorMessages = parsedResult.error.errors
      .map((err) => err.message)
      .join(", ");
    return { success: false, message: errorMessages };
  }

  const { identifier, password } = parsedResult.data;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

  try {
    const user = await findUserByUsernameOrEmail(
      isEmail ? undefined : identifier,
      isEmail ? identifier : undefined
    );

    if (!user) return { success: false, message: "Invalid credentials" };

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return { success: false, message: "Invalid credentials" };
    }

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
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function logout() {
  const { session } = await validateRequest();
  if (!session) {
    return { message: "Unauthorized" };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  (await cookies()).set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  redirect("/login");
}

export async function sendResetLink(prevState: any, formData: FormData) {
  const parsedResult = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsedResult.success) {
    const errorMessages = parsedResult.error.errors
      .map((err) => err.message)
      .join(", ");
    return { success: false, message: errorMessages };
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

    const token = generateResetToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiry
    await setResetToken(email, token, expires);

    const res = await sendPasswordResetEmail(email, token);
    if (!res) return { success: false, message: "Failed to send email" };

    return {
      success: true,
      message: "If an account exists, a reset link was sent.",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const parsedResult = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    resetToken: formData.get("resetToken"),
  });

  if (!parsedResult.success) {
    const errorMessages = parsedResult.error.errors
      .map((err) => err.message)
      .join(", ");
    return { success: false, message: errorMessages };
  }

  const { password, resetToken } = parsedResult.data;

  try {
    const user = await findUserByResetToken(resetToken);
    if (!user) return { success: false, message: "Invalid reset token" };

    const hashedPassword = await argon2.hash(password);
    await updateUserPassword(user.id, hashedPassword);
    await clearResetToken(user.id);
    return { success: true, message: "Password reset was successful" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
