import { cache } from "react";
import { eq, or, and, gt } from "drizzle-orm";
import axios from "axios";
import { db } from "@/lib/db/db";
import { users, type UserDto, type User, usersToAvatars } from "@/lib/db/schema";
import type { DIDCreditsResponse } from "@/lib/types";

export async function findUserByUsernameOrEmail(
  username?: string,
  email?: string
): Promise<User | null> {
  if (username || email) {
    const usersRes = await db
      .select()
      .from(users)
      .where(
        or(
          username ? eq(users.username, username) : undefined,
          email ? eq(users.email, email) : undefined
        )
      )
      .limit(1);
    return usersRes[0] ?? null;
  }

  throw new Error("No valid identifier provided");
}

export const getUsersDto = cache(async (): Promise<UserDto[]> => {
  return db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      credits: users.credits,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users);
});

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
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
    .where(eq(users.email, email));
}

export async function clearResetToken(userId: string) {
  await db
    .update(users)
    .set({ resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, userId));
}

export async function updateUserPassword(userId: string, hashedPassword: string) {
  await db
    .update(users)
    .set({ passwordHash: hashedPassword })
    .where(eq(users.id, userId));
}

export async function getUserAvatars(userId: string) {
  const res = await db.query.usersToAvatars.findMany({
    where: eq(usersToAvatars.userId, userId),
    with: {
      avatar: true,
    },
  });
  return res.map((ua) => ua.avatar);
}

export async function getUserCredits(userId: string, userRole: string) {
  if (userRole === "admin") {
    const res = await axios.get<DIDCreditsResponse>("https://api.d-id.com/credits", {
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return res.data.remaining ?? null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      credits: true,
    },
  });

  return user?.credits ?? null;
}
