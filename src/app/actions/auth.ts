"use server";

import { findUserByUsername, isUsernameUnique } from "@/lib/utils.server";
import { generateIdFromEntropySize } from "lucia";
import * as argon2 from "argon2"; // downgraded version because of an error with vercel - https://github.com/vercel/next.js/discussions/65978
import { userTable, type NewUser } from "@/lib/db/schema";
import { db } from "@/lib/db/db";
import { createUserSchema, loginUserSchema } from "@/lib/validationSchema";
import { lucia } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginUser(prevState: any, formData: FormData) {
  const data = {
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parseResult = loginUserSchema.safeParse(data);

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors
      .map((err) => err.message)
      .join(", ");
    return { message: errorMessages };
  }

  const { username, password } = parseResult.data;

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
  const data = {
    username: formData.get("username") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const parseResult = createUserSchema.safeParse(data);

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
