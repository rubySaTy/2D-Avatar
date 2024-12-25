import { db } from "@/lib/db/db";
import { users, type UserDto, type User } from "@/lib/db/schema";
import { eq, or, and, gt } from "drizzle-orm";

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

export async function getUsersDto(): Promise<UserDto[]> {
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
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function findUserByResetToken(token: string) {
  return db.query.users.findFirst({
    where: and(
      eq(users.resetToken, token),
      gt(users.resetTokenExpires, new Date())
    ),
  });
}

export async function setResetToken(
  email: string,
  token: string,
  expires: Date
) {
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

export async function updateUserPassword(
  userId: string,
  hashedPassword: string
) {
  await db
    .update(users)
    .set({ passwordHash: hashedPassword })
    .where(eq(users.id, userId));
}
