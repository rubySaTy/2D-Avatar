import "server-only";

import { eq, or, and, gt } from "drizzle-orm";
import axios from "axios";
import { db } from "@/lib/db/db";
import { users, type UserDto, type User, type NewUser, sessions } from "@/lib/db/schema";
import { generateIdFromEntropySize } from "lucia";
import * as argon2 from "argon2";
import type { DIDCreditsResponse } from "@/lib/types";

export async function createUserInDB(
  username: string,
  email: string,
  password: string,
  role: "admin" | "therapist"
) {
  const passwordHash = await argon2.hash(password);
  const newUser: NewUser = {
    id: generateIdFromEntropySize(10),
    username,
    usernameLower: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    role,
  };

  await db.insert(users).values(newUser);
}

export async function updateUserInDB(
  existingUser: User,
  username: string,
  email: string,
  role?: "admin" | "therapist"
) {
  const updates: Partial<NewUser> = {
    username,
    email: email.toLowerCase(),
    usernameLower: username.toLowerCase(),
  };

  const roleChanged = role && existingUser.role !== role;
  if (roleChanged) updates.role = role;
  const [updatedUser] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, existingUser.id))
    .returning();

  // If user role has changed, delete their sessions to sign them out.
  if (roleChanged) await db.delete(sessions).where(eq(sessions.userId, existingUser.id));

  return updatedUser;
}

export async function findUserByUsernameOrEmail(
  username?: string,
  email?: string
): Promise<User | null> {
  if (username || email) {
    const user = await db.query.users.findFirst({
      where: or(
        username ? eq(users.usernameLower, username.toLowerCase()) : undefined,
        email ? eq(users.email, email.toLowerCase()) : undefined
      ),
    });

    return user ?? null;
  }

  throw new Error("No valid identifier provided");
}

export async function getUsersDto(): Promise<UserDto[]> {
  return db
    .select({
      id: users.id,
      username: users.username,
      usernameLower: users.usernameLower,
      email: users.email,
      role: users.role,
      credits: users.credits,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users);
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
}

export async function findUserByResetToken(token: string) {
  return db.query.users.findFirst({
    where: and(eq(users.resetToken, token), gt(users.resetTokenExpires, new Date())),
  });
}

export async function setResetToken(email: string, token: string, expires: Date) {
  await db
    .update(users)
    .set({ resetToken: token, resetTokenExpires: expires })
    .where(eq(users.email, email.toLowerCase()));
}

export async function clearResetToken(userId: string) {
  await db
    .update(users)
    .set({ resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, userId));
}

export async function updateUserPassword(userId: string, password: string) {
  const hashedPassword = await argon2.hash(password);

  await db
    .update(users)
    .set({ passwordHash: hashedPassword })
    .where(eq(users.id, userId));
}

export async function getUserByID(userId: string) {
  return db.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function getUserCredits(userId: string, userRole: string) {
  try {
    if (userRole === "admin") {
      const res = await axios.get<DIDCreditsResponse>(
        `${process.env.DID_API_URL}/credits`,
        {
          headers: {
            Authorization: `Basic ${process.env.DID_API_KEY}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      return res.data.remaining;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        credits: true,
      },
    });

    return user?.credits ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteUserById(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export async function verifyUserPassword(passwordHash: string, password: string) {
  return argon2.verify(passwordHash, password);
}
