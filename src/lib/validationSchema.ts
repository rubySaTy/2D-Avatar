import { z } from "zod";

// lib/schemas/fields.ts
const usernameField = z
  .string()
  .min(3, { message: "Username must be at least 3 characters long." })
  .max(30, { message: "Username must be at most 30 characters long." })
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Username can only contain letters, numbers, underscores, hyphens, and periods.",
  });

const passwordField = z
  .string()
  .min(1, { message: "Password must be at least 1 character long." })
  .max(16, { message: "Password must be at most 16 characters long." });

export const createUserSchema = z.object({
  username: usernameField,
  password: passwordField,
  role: z.enum(["admin", "therapist"], {
    errorMap: () => ({
      message: "Role must be either 'admin' or 'therapist'.",
    }),
  }),
});

export const loginUserSchema = z.object({
  username: usernameField,
  password: passwordField,
});
