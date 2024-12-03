import { db } from "@/lib/db/db";
import { users, type UserDto, type User } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

// TODO: omit `passwordHash` field from user object that the function returns?
export async function findUser(
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
  const usersArray = await db
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

  return usersArray;
}
