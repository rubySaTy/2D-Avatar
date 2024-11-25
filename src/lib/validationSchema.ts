import { z } from "zod";

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

const emailField = z.string().email({ message: "Invalid email address." });

const roleEnum = z.enum(["admin", "therapist"], {
  errorMap: () => ({
    message: "Role must be either 'admin' or 'therapist'.",
  }),
});

const baseUserSchema = z.object({
  username: usernameField,
  email: emailField,
});

export const createUserSchema = baseUserSchema.extend({
  password: passwordField,
  role: roleEnum,
});

export const editUserSchema = baseUserSchema.extend({
  role: roleEnum.optional().nullable(),
});

export const loginUserSchema = z.object({
  username: usernameField,
  password: passwordField,
});

export const createTalkStreamSchema = z
  .object({
    meetingLink: z.string().min(1, { message: "Meeting link is required" }),

    // Preprocess 'message': Convert empty strings to undefined
    message: z.preprocess((val) => {
      if (typeof val === "string" && val.trim() === "") return undefined;
      return val;
    }, z.string().min(1, { message: "Message input is required" }).optional()),

    // Preprocess 'premadeMessage': Convert empty strings to null
    premadeMessage: z.preprocess((val) => {
      if (typeof val === "string" && val.trim() === "") return null;
      return val;
    }, z.string().nullable().optional()),

    providerType: z.string().nullable().optional(),
    voiceId: z.string().nullable().optional(),
    voiceStyle: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      // If 'premadeMessage' is null or undefined, 'message' must be provided
      if (data.premadeMessage == null) {
        return (
          typeof data.message === "string" && data.message.trim().length > 0
        );
      }
      // If 'premadeMessage' is provided, 'message' is optional
      return true;
    },
    {
      message: "Message input is required",
      path: ["message"], // This sets the error on the 'message' field
    }
  );

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
