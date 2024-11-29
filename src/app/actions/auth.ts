"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lucia } from "@/auth";
import * as argon2 from "argon2"; // downgraded version because of an error with vercel - https://github.com/vercel/next.js/discussions/65978
import { loginUserSchema } from "@/lib/validationSchema";
import { validateRequest } from "@/lib/auth";
import { findUser } from "@/services";

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
    const user = await findUser(
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
    cookies().set(
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
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  redirect("/login");
}
