import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "../utils/db.ts";
import { DIDService } from "../services/didService.ts";
import { avatars, sessions } from "../utils/schema.ts";
import type { NewAvatar, NewSession } from "../utils/schema.ts";
import type { AuthenticatedRequest } from "../middlewares/authenticateJWT.ts";

export class PsychologistController {
  static async createAvatar(req: AuthenticatedRequest, res: Response) {
    const { avatarName, imageUrl, voiceSampleUrl } = req.body;
    const userId = req.user.userId;

    const newAvatar: NewAvatar = {
      userId,
      avatarName,
      imageUrl,
      voiceSampleUrl,
    };

    await db.insert(avatars).values(newAvatar);

    res.status(201).json({ message: "Avatar created" });
  }

  static async createSession(req: AuthenticatedRequest, res: Response) {
    const { avatarId } = req.body;
    const userId = req.user.userId;

    const query = db.select().from(avatars);
    query.where(eq(avatars.avatarId, avatarId));
    query.where(eq(avatars.userId, userId));

    const avatarRecords = await query;

    if (avatarRecords.length === 0) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    const meetingLink = uuidv4();

    const newSession: NewSession = {
      userId,
      avatarId,
      meetingLink,
    };

    await db.insert(sessions).values(newSession);
    try {
      // Use the avatar's image URL to create a D-ID stream
      const didResponse = await DIDService.createStream(
        avatarRecords[0].imageUrl
      );
      // You can store additional information from didResponse if needed
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error creating D-ID stream" });
    }

    res.status(201).json({ meetingLink });
  }

  // Additional methods for listing avatars, sessions, etc.
}
