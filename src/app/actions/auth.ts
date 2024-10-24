"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lucia } from "@/auth";
import { generateIdFromEntropySize } from "lucia";
import * as argon2 from "argon2"; // downgraded version because of an error with vercel - https://github.com/vercel/next.js/discussions/65978
import { findUserByUsername, isUsernameUnique } from "@/lib/utils.server";
import { userTable, type NewUser } from "@/lib/db/schema";
import { db } from "@/lib/db/db";
import { createUserSchema, loginUserSchema } from "@/lib/validationSchema";
import { validateRequest } from "@/lib/auth";

export async function loginUser(prevState: any, formData: FormData) {
  const parsedResult = loginUserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsedResult.success) {
    const errorMessages = parsedResult.error.errors
      .map((err) => err.message)
      .join(", ");
    return { message: errorMessages };
  }

  const { username, password } = parsedResult.data;

  try {
    const user = await findUserByUsername(username);
    if (!user) {
      return { message: "Invalid credentials" };
    }

    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return { message: "Invalid credentials" };
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } catch (error) {
    console.error(error);
    return { message: "An unexpected error occurred" };
  }

  redirect("/");
}

export async function createUser(prevState: any, formData: FormData) {
  const parseResult = createUserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((err) => err.message);
    return { message: errorMessages.join(", ") };
  }

  const { username, password, role } = parseResult.data;

  try {
    if (!(await isUsernameUnique(username))) {
      return { message: "User already exists" };
    }

    const passwordHash = await argon2.hash(password);
    const newUser: NewUser = {
      id: generateIdFromEntropySize(10),
      username,
      passwordHash,
      role,
    };

    await db.insert(userTable).values(newUser);
    return { message: "User created" };
  } catch (error) {
    console.error(error);
    return { message: "An unexpected error occurred" };
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
