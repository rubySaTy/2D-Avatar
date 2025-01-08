import "server-only";

import { db } from "@/lib/db/db";
import {
  usersToAvatars,
  avatars,
  type NewAvatar,
  type Avatar,
  type AvatarWithUsersDto,
} from "@/lib/db/schema";
import { sanitizeString, sanitizeFileName } from "@/lib/utils";
import { eq, inArray } from "drizzle-orm";
import { createIdleVideo } from "./d-idService";
import { deleteS3Objects, uploadToS3 } from "./s3Service";
import { redis } from "@/lib/integrations/redis";

export async function createAvatarData(
  avatarName: string,
  imageInput: File | Buffer,
  associatedUsersIds: string[],
  uploaderId: string,
  isPublic: boolean = false
) {
  let s3ImageKey: string | null = null; // keep track of the uploaded S3 key

  try {
    // 1) process image/video
    const { imageUrl, imageKey } = await processAvatarAndUploadToS3(
      avatarName,
      imageInput
    );

    // store key for potential s3 cleanup if something goes wrong later
    s3ImageKey = imageKey;

    // 2) create idle video
    const createdIdleVideoRes = await createIdleVideo(imageUrl);
    const newAvatar: NewAvatar = {
      avatarName,
      imageKey,
      imageUrl,
      uploaderId,
      isPublic,
    };

    // 3) insert avatar in DB
    await db.transaction(async (tx) => {
      const [createdAvatar] = await tx.insert(avatars).values(newAvatar).returning();

      const associations = associatedUsersIds.map((userId) => ({
        userId,
        avatarId: createdAvatar.id,
      }));

      await tx.insert(usersToAvatars).values(associations);

      // 4) store the new avatar ID in Redis for incoming webhook
      redis.set(createdIdleVideoRes.id, createdAvatar.id, { ex: 300 });
    });
  } catch (error) {
    if (s3ImageKey) {
      await deleteS3Objects([s3ImageKey]).catch((deleteError) => {
        console.error(
          "Error while cleaning up the S3 file after a failed operation:",
          deleteError
        );
      });
    }

    throw error;
  }
}

export async function editAvatarData(
  existingAvatar: Avatar,
  avatarId: number,
  avatarName: string,
  imageFile?: File,
  associatedUsersIds?: string[]
) {
  // 1) Prepare files to delete (if any)
  const filesToDelete: string[] = [];
  let newS3ImageKey: string | null = null; // keep track of the uploaded S3 key

  // 2) prepare update object for avatar
  const updateData: Partial<NewAvatar> = {
    avatarName,
  };

  try {
    if (imageFile && imageFile.size > 0) {
      // 3) process image/video if user has uploaded a new one
      const { imageKey, imageUrl } = await processAvatarAndUploadToS3(
        avatarName,
        imageFile
      );

      // store key for potential s3 cleanup if something goes wrong later
      newS3ImageKey = imageKey;

      // 4) create idle video
      const createdIdleVideoRes = await createIdleVideo(imageUrl);

      // 5) update object with new key of new image file
      updateData.imageKey = imageKey;
      updateData.imageUrl = imageUrl;

      // 6) Mark old files for deletion
      filesToDelete.push(existingAvatar.imageKey);
      if (existingAvatar.idleVideoKey) filesToDelete.push(existingAvatar.idleVideoKey);

      // 7) store Avatar ID in Redis for incoming webhook
      redis.set(createdIdleVideoRes.id, existingAvatar.id, { ex: 300 });
    }

    // 8) update avatar
    await db.transaction(async (tx) => {
      await tx.update(avatars).set(updateData).where(eq(avatars.id, avatarId));

      if (!associatedUsersIds) return;

      const existingAssociations = await tx
        .select({ userId: usersToAvatars.userId })
        .from(usersToAvatars)
        .where(eq(usersToAvatars.avatarId, avatarId));

      const existingUserIds = existingAssociations.map((assoc) => assoc.userId);

      if (
        existingUserIds.length !== associatedUsersIds.length ||
        !associatedUsersIds.every((userId) => existingUserIds.includes(userId))
      ) {
        // 9) Delete existing user associations
        await tx.delete(usersToAvatars).where(eq(usersToAvatars.avatarId, avatarId));

        // 10) Insert new user associations (if any)
        const associations = associatedUsersIds.map((userId) => ({
          userId,
          avatarId,
        }));

        if (associations.length > 0) await tx.insert(usersToAvatars).values(associations);
      }
    });

    // 11) Delete old S3 files after successful upload and database transaction
    if (filesToDelete.length > 0) await deleteS3Objects(filesToDelete);
  } catch (error) {
    if (newS3ImageKey) {
      await deleteS3Objects([newS3ImageKey]).catch((deleteError) => {
        console.error(
          "Error while cleaning up the S3 file after a failed operation:",
          deleteError
        );
      });
    }

    throw error;
  }
}

export async function removeAvatar(avatarId: number) {
  const [deletedAvatar] = await db
    .delete(avatars)
    .where(eq(avatars.id, avatarId))
    .returning();

  const { imageKey, idleVideoKey } = deletedAvatar;

  const keysToDelete: string[] = [imageKey];
  if (idleVideoKey) keysToDelete.push(idleVideoKey);
  await deleteS3Objects(keysToDelete);
}

export async function getAvatarById(avatarId: number) {
  return db.query.avatars.findFirst({ where: eq(avatars.id, avatarId) });
}

export async function getPublicAvatars() {
  return db.query.avatars.findMany({ where: eq(avatars.isPublic, true) });
}

export async function updateAvatar(avatarId: number, updatedAvatar: Partial<NewAvatar>) {
  return db.update(avatars).set(updatedAvatar).where(eq(avatars.id, avatarId));
}

export async function updateManyAvatars(
  avatarIds: number[],
  updatedAvatar: Partial<NewAvatar>
) {
  return db.update(avatars).set(updatedAvatar).where(inArray(avatars.id, avatarIds));
}

export async function getAvatarsWithAssociatedUsers(): Promise<AvatarWithUsersDto[]> {
  const avatarsWithUsers = await db.query.avatars.findMany({
    with: {
      usersToAvatars: {
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              usernameLower: true,
              email: true,
              role: true,
              credits: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  return avatarsWithUsers.map((avatar) => ({
    ...avatar,
    associatedUsers: avatar.usersToAvatars.map((uta) => uta.user),
    usersToAvatars: undefined,
  }));
}

async function processAvatarAndUploadToS3(avatarName: string, imageInput: File | Buffer) {
  const sanitizedAvatarName = sanitizeString(avatarName);

  // Handle filename differently based on input type
  const fileName = `${sanitizedAvatarName}-${
    imageInput instanceof File ? sanitizeFileName(imageInput.name) : `${Date.now()}.png` // Default name for Buffer
  }`;

  // Handle content type differently based on input type
  const contentType = imageInput instanceof File ? imageInput.type : "image/png"; // Default type for Buffer

  // Handle the data stream differently based on input type
  const data = imageInput instanceof File ? imageInput.stream() : imageInput;

  const { url: imageUrl, key: imageKey } = await uploadToS3(
    data,
    "images/",
    fileName,
    contentType
  );

  return { imageUrl, imageKey };
}

export async function getAvatarsByVoiceId(voiceId: string) {
  return db.query.avatars.findMany({
    where: eq(avatars.elevenlabsClonedVoiceId, voiceId),
    columns: {
      id: true,
      avatarName: true,
      imageUrl: true,
    },
  });
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
