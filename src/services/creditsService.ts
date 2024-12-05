import { db } from "@/lib/db/db";
import { creditTransactions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/*
TODO: Handle edge cases (e.g., race conditions/concurrent transactions, credit limits)

    Negative Amounts: Ensure that the amount parameter is always positive for additions and appropriately handled for removals.
    Concurrent Transactions: Implement mechanisms like optimistic locking to handle concurrent modifications.
    Credit Limits: If there's a maximum credit limit, enforce it during additions.
*/

export async function addCredits(
  userId: string,
  amount: number,
  reason: string
) {
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new Error("User not found");
    if (user.role === "admin")
      throw new Error("Cannot add credits to an admin.");

    const updatedCreditsAmount = user.credits + amount;

    await tx
      .update(users)
      .set({ credits: updatedCreditsAmount })
      .where(eq(users.id, userId));

    await tx.insert(creditTransactions).values({
      userId,
      amount,
      reason,
    });
  });
}

export async function removeCredits(
  userId: string,
  amount: number,
  reason: string
) {
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new Error("User not found");
    if (user.role === "admin")
      throw new Error("Cannot remove credits from an admin.");

    if (user.credits < amount)
      throw new Error(
        `User with ID ${userId} has insufficient credits. Requested: ${amount}, Available: ${user.credits}.`
      );

    const updatedCreditsAmount = user.credits - amount;
    await tx
      .update(users)
      .set({ credits: updatedCreditsAmount })
      .where(eq(users.id, userId));

    await tx.insert(creditTransactions).values({
      userId,
      amount: -amount, // Negative for removal
      reason,
    });
  });
}

export async function updateUserCredits(
  userId: string,
  amount: number,
  reason: string
) {
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new Error("User not found");
    if (user.role === "admin")
      throw new Error("Cannot modify credits for an admin.");

    const updatedCreditsAmount = user.credits + amount;

    if (updatedCreditsAmount < 0) {
      throw new Error("Insufficient credits for this operation.");
    }

    // Optionally, enforce maximum credit limits here
    // if (updatedCreditsAmount > MAX_CREDITS) {
    //   throw new Error("Credit limit exceeded.");
    // }

    await tx
      .update(users)
      .set({ credits: updatedCreditsAmount })
      .where(eq(users.id, userId));

    await tx.insert(creditTransactions).values({
      userId,
      amount,
      reason,
    });
  });
}

export async function getUserCredits(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      credits: true,
    },
  });

  return user?.credits ?? null;
}
