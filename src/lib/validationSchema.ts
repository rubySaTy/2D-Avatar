import { z } from "zod";

export const userIdSchema = z.string().min(1, { message: "User ID cannot be empty." });

const usernameField = z
  .string()
  .min(3, { message: "Username must be at least 3 characters long" })
  .max(30, { message: "Username must be at most 30 characters long" })
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Username can only contain English letters, numbers, underscores, hyphens, and periods",
  });

const passwordField = z
  .string()
  .min(6, { message: "Password must be at least 6 character long." })
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
  role: roleEnum,
});

export const createUserSchema = baseUserSchema.extend({
  password: passwordField,
});

export const editUserSchema = baseUserSchema.extend({
  userId: userIdSchema,
});

export const updateUserSchema = z.object({
  username: usernameField,
  email: emailField,
});

export const loginUserSchema = z.object({
  identifier: z.union([usernameField, emailField]),
  password: passwordField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: passwordField,
    resetToken: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"], // This targets the specific field where the error will show
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const createTalkStreamSchema = z.object({
  meetingLink: z.string().min(1, { message: "Meeting link is required" }),

  // Preprocess 'message': Convert empty strings to undefined
  message: z.preprocess((val) => {
    if (typeof val === "string" && val.trim() === "") return undefined;
    return val;
  }, z.string().min(1, { message: "Message input is required" }).optional()),

  voiceId: z.string().nullable().optional(),
  voiceStyle: z.string().nullable().optional(),
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: "Only JPEG, JPG, or PNG images are allowed.",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "File size cannot exceed 10MB.",
  });

const voiceFilesSchema = z
  .array(z.instanceof(File))
  .min(1, { message: "At least one voice file is required" })
  .transform((files) =>
    files.filter((file) => file.size > 0 && file.name !== "undefined")
  )
  .pipe(
    z
      .array(z.instanceof(File))
      .min(1, { message: "At least one valid voice file is required" })
      .max(25, { message: "You can upload up to 25 voice files" })
      .refine((files) => files.every((file) => file.size <= 10 * 1024 * 1024), {
        message: "Each file must be less than or equal to 10MB",
      })
      .refine(
        (files) => {
          return files.every(
            (file) => file.type.startsWith("audio/") || file.type.startsWith("video/")
          );
        },
        { message: "Invalid file type. Only audio or video files are allowed." }
      )
  );

export const avatarIdSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
}, z.number().min(1, { message: "Avatar ID must be a positive number." }));

const avatarNameField = z
  .string()
  .min(3, { message: "Avatar name must be at least 3 characters long" })
  .max(20, { message: "Avatar name must be at most 20 characters long" })
  .regex(/^[a-zA-Z0-9._-]+$/, {
    message:
      "Avatar name can only contain English letters, numbers, underscores, hyphens, and periods",
  });

const baseAvatarSchema = z.object({
  avatarName: avatarNameField,
});

export const createAvatarSchema = baseAvatarSchema.extend({
  imageFile: imageFileSchema,
  associatedUsersIds: z
    .array(userIdSchema)
    .min(1, { message: "At least one user must be selected" }),
});

export const editAvatarSchema = baseAvatarSchema.extend({
  avatarId: avatarIdSchema,
  associatedUsersIds: z.array(userIdSchema).optional(),
});

export const generateLLMAvatarSchema = z.object({
  prompt: z.string().min(1, { message: "Prompt is required." }),
});

export const generateLLMAvatarWithImageSchema = generateLLMAvatarSchema.extend({
  imageFile: imageFileSchema,
});

export const createClonedVoiceSchema = z.object({
  voiceName: z.string().min(1, { message: "Voice name is required." }),
  voiceFiles: voiceFilesSchema,
  removeBackgroundNoise: z.coerce.boolean(),
  // description: z.string().optional(), TODO: Causes an error that takes too long and causes timeout? move to route-handler?
  associatedAvatarsIds: z
    .array(avatarIdSchema)
    .min(1, { message: "At least one avatar must be selected" }),
});

export const updateCreditsSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  reason: z.string().min(1, "Reason is required."),
});

export const transcribedTextSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[A-Za-z\u0590-\u05FF0-9\s.,!?()'";\-:@#$%&*]+$/, {
    message:
      "Text can only contain English and Hebrew letters, numbers, spaces, and basic punctuation",
  });

export const CreateLLMGeneratedAvatarSchema = z.object({
  avatarName: avatarNameField,
  imageUrl: z.string().min(1, { message: "Image URL is required." }),
});
