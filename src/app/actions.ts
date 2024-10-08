"use server";

import { cookies } from "next/headers";
import axios from "axios";
import { db } from "@/lib/db/db";
import { shortUUID, validateImageUrl } from "@/lib/utils";
import { getUser, validateRequest } from "@/lib/getUser";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2"; // downgraded version because of an error with vercel - https://github.com/vercel/next.js/discussions/65978
import { generateIdFromEntropySize } from "lucia";
import { lucia } from "@/auth";
import { avatarTable, meetingSessionTable, userTable } from "@/lib/db/schema";
import type {
  Avatar,
  NewAvatar,
  NewMeetingSession,
  NewUser,
} from "@/lib/db/schema";
import { getSessionByMeetingLink } from "@/lib/getMeetingSession";

export async function loginUser(prevState: any, formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  // TODO: "Validate username and password";
  if (!username || !password) {
    return { message: "Invalid credentials" };
  }

  try {
    const userRecords = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username));

    if (userRecords.length === 0) {
      return { message: "Invalid credentials" };
    }

    const user = userRecords[0];
    const validPassword = await argon2.verify(user.passwordHash, password);
    if (!validPassword) {
      return { message: "Invalid credentials" };
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } catch (error) {
    console.error(error);
    return { message: "An unexpected error occurred" };
  }

  redirect("/");
}

export async function createUser(prevState: any, formData: FormData) {
  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString();

  // TODO: "Validate username, password and role, maybe with zod";
  if (!username || !password || !role) {
    return { message: "Invalid credentials" };
  }

  if (role !== "admin" && role !== "therapist") {
    return { message: "Invalid role" };
  }

  try {
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return { message: "User already exists" };
    }

    const passwordHash = await argon2.hash(password);
    const newUser: NewUser = {
      id: generateIdFromEntropySize(10),
      username,
      passwordHash,
      role,
    };

    await db.insert(userTable).values(newUser);
    return { message: "User created" };
  } catch (error) {
    console.error(error);
    return { message: "An unexpected error occurred" };
  }
}

export async function createAvatar(prevState: any, formData: FormData) {
  const avatarName = formData.get("avatarName")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();
  const selectedUserId = formData.get("userId")?.toString();

  if (!avatarName || !imageUrl || !selectedUserId) {
    return { message: "Invalid params" };
  }

  const isImageValid = await validateImageUrl(imageUrl);
  if (!isImageValid) {
    return { message: "Invalid image URL" };
  }

  const newAvatar: NewAvatar = {
    userId: selectedUserId,
    avatarName,
    imageUrl,
    idleVideoUrl: "", // TODO:
  };

  try {
    await db.insert(avatarTable).values(newAvatar);
    return { message: "Avatar created" };
  } catch (error) {
    console.error(error);
    return { message: "Error creating avatar" };
  }
}

export async function createSession(prevState: any, formData: FormData) {
  const avatarJson = formData.get("avatar")?.toString();
  if (!avatarJson) {
    return { message: "Invalid avatar" };
  }

  const avatar: Avatar = JSON.parse(avatarJson);
  const user = await getUser();
  if (!user) {
    return { message: "Invalid credentials" };
  }

  const meetingLink = shortUUID();
  try {
    const newMeetingSession: NewMeetingSession = {
      userId: user.id,
      avatarId: avatar.id,
      meetingLink,
    };

    await db.insert(meetingSessionTable).values(newMeetingSession);
  } catch (error) {
    console.error(error);
    return { message: "Error creating session" };
  }

  redirect(`/therapist/${meetingLink}`);
}

export async function sendICECandidate(
  streamId: string,
  sessionId: string,
  candidate: RTCIceCandidateInit
) {
  try {
    axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}/ice`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          session_id: sessionId,
        },
      }
    );
  } catch (error) {
    console.error("Error in 'sendICECandidate'");
    console.error(error);
  }
}

export async function notifyICEGatheringComplete(
  sessionId: string,
  streamId: string
) {
  try {
    axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}/ice`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { session_id: sessionId },
      }
    );
  } catch (error) {
    console.error("Error in 'notifyICEGatheringComplete'");
    console.error(error);
  }
}

export async function sendSdpAnswer(
  streamId: string,
  answer: RTCSessionDescriptionInit,
  sessionId: string
) {
  try {
    await axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}/sdp`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { answer, session_id: sessionId },
      }
    );
  } catch (error) {
    console.error("Error in 'sendSdpAnswer'");
    console.error(error);
  }
}

export async function closeStream(streamId: string, sessionId: string) {
  try {
    await axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${streamId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: { session_id: sessionId },
      }
    );
  } catch (error) {
    console.error("Error in 'closeStream'");
    console.error(error);
  }
}

export async function createTalkStream(
  meetingLink: string,
  formData: FormData
) {
  const input = formData.get("message")?.toString();
  console.log(meetingLink, input);

  try {
    const session = await getSessionByMeetingLink(meetingLink);
    if (!session || !session.didStreamId || !session.didSessionId) {
      console.error(`Session not found with meeting link ${meetingLink}`);
      throw new Error("Session not found");
    }

    const playResponse = await axios(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams/${session.didStreamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {
          script: {
            type: "text",
            provider: {
              type: "microsoft",
              voice_id: "en-US-EmmaMultilingualNeural",
              // voice_config: { style: "neutral" },
            },
            ssml: "false",
            input: input,
          },
          config: { fluent: true, pad_audio: "0.0" },
          session_id: session.didSessionId,
        },
      }
    );

    console.log(playResponse.data);
  } catch (error) {
    console.error("Error in 'createTalkStream'");
    console.error(error);
  }
}

export async function logout() {
  const { session } = await validateRequest();
  if (!session) {
    return { message: "Unauthorized" };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  );
  redirect("/login");
}

interface SessionResponse {
  id: string;
  offer: RTCSessionDescriptionInit;
  ice_servers: RTCIceServer[];
  session_id: string;
}

// Initialize D-ID stream
export async function createDIDStream(meetingLink: string) {
  if (!meetingLink) return null;

  try {
    const session = await getSessionByMeetingLink(meetingLink);
    if (!session) return null;
    const avatars = await db
      .select()
      .from(avatarTable)
      .where(eq(avatarTable.id, session.avatarId))
      .limit(1);
    const avatar = avatars[0];

    if (!avatar) return null;

    const sessionResponse = await axios<SessionResponse>({
      url: `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams`,
      method: "POST",
      data: { source_url: avatar.imageUrl, stream_warmup: true },
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!sessionResponse.data) return null;

    await db
      .update(meetingSessionTable)
      .set({
        didStreamId: sessionResponse.data.id,
        didSessionId: sessionResponse.data.session_id,
        offer: sessionResponse.data.offer,
        iceServers: sessionResponse.data.ice_servers,
      })
      .where(eq(meetingSessionTable.meetingLink, session.meetingLink));
    console.log(`DB updated successfully at meeting link ${meetingLink}`);

    return sessionResponse.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
