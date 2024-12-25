import { db } from "@/lib/db/db";
import {
  users,
  usersToAvatars,
  avatars,
  meetingSessions,
  type Avatar,
  type NewAvatar,
  type MeetingSession,
} from "@/lib/db/schema";
import { sanitizeString, sanitizeFileName } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { createIdleVideo } from "./d-idService";
import { uploadToS3 } from "./s3Service";

export async function addAvatar(
  NewAvatar: NewAvatar,
  associatedUsersIds: string[]
) {
  const avatarId = await db.transaction(async (tx) => {
    const createdAvatar = await tx
      .insert(avatars)
      .values(NewAvatar)
      .returning();

    const associations = associatedUsersIds.map((userId) => ({
      userId,
      avatarId: createdAvatar[0].id,
    }));

    await tx.insert(usersToAvatars).values(associations);
    return createdAvatar[0].id;
  });

  return avatarId;
}

export async function getAvatarById(avatarId: number) {
  return db.query.avatars.findFirst({ where: eq(avatars.id, avatarId) });
}

export async function updateAvatar(
  avatarId: number,
  updatedAvatar: Partial<NewAvatar>
) {
  return db.update(avatars).set(updatedAvatar).where(eq(avatars.id, avatarId));
}

export async function getUserAvatars(userId: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      usersToAvatars: {
        with: {
          avatar: true,
        },
      },
    },
  });
  return result?.usersToAvatars.map((ua) => ua.avatar) ?? [];
}

type MeetingSessionWithAvatar = MeetingSession & {
  avatar: Avatar;
};

// TODO: should be moved to meetingSession service?
export async function getMeetingSessionWithAvatar(
  meetingLink: string
): Promise<MeetingSessionWithAvatar | null> {
  try {
    const result = await db.query.meetingSessions.findFirst({
      where: eq(meetingSessions.meetingLink, meetingLink),
      with: {
        avatar: true,
      },
    });

    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Error getting avatar by meeting link from DB:", error);
    return null;
  }
}

export async function getAvatars() {
  return db.query.avatars.findMany();
}

export async function processAvatarAndVideo(
  avatarName: string,
  imageFile: File
) {
  const sanitizedAvatarName = sanitizeString(avatarName);
  const sanitizedFileName = sanitizeFileName(imageFile.name);

  const fileName = `${sanitizedAvatarName}-${sanitizedFileName}`;
  const { url: imageUrl, key: imageKey } = await uploadToS3(
    imageFile.stream(),
    "avatars/",
    `${fileName}`,
    imageFile.type
  );

  const createdIdleVideoRes = await createIdleVideo(imageUrl);

  return {
    imageUrl,
    imageKey,
    createdIdleVideoRes,
  };
}
