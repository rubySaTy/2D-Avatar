import { z } from "zod";

// lib/schemas/fields.ts
const usernameField = z
  .string()
  .min(3, { message: "Username must be at least 3 characters long" })
  .max(30, { message: "Username must be at most 30 characters long" })
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Username can only contain letters, numbers, underscores, hyphens, and periods",
  });

const passwordField = z
  .string()
  .min(1, { message: "Password must be at least 1 character long." })
  .max(16, { message: "Password must be at most 16 characters long." });

export const createUserSchema = z.object({
  username: usernameField,
  email: z.string().email(),
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

export const createTalkStreamSchema = z.object({
  meetingLink: z.string().min(1, { message: "Meeting link is required" }),
  message: z.string().min(1, { message: "Message input is required" }),
  providerType: z.string().nullable().optional(),
  voiceId: z.string().nullable().optional(),
  voiceStyle: z.string().nullable().optional(),
});

export const avatarSchema = z.object({
  avatarName: z.string().min(1),
  userIds: z.array(z.string()).min(1, "At least one user must be selected"),
  imageFile: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Only image files are allowed",
    }),
  voiceFiles: z
    .array(z.instanceof(File))
    .transform((files) =>
      files.filter((file) => file.size > 0 && file.name !== "undefined")
    )
    .pipe(
      z
        .array(z.instanceof(File))
        .max(25, { message: "You can upload up to 25 voice files" })
        .refine(
          (files) => files.every((file) => file.size <= 10 * 1024 * 1024),
          {
            message: "Each file must be less than or equal to 10MB",
          }
        )
        .refine(
          (files) =>
            files.every((file) =>
              ["audio/mp3", "audio/wav", "audio/mpeg", "audio/ogg"].includes(
                file.type
              )
            ),
          { message: "Only MP3, WAV, OGG and MPEG files are allowed" }
        )
    ),
});
