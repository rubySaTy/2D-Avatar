"use server";

import { db } from "@/lib/db/db";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { meetingSessions } from "@/lib/db/schema";
import { generateShortUUID } from "@/lib/utils";
import { openAI } from "@/lib/openai";
import { ablyRest } from "@/lib/ably";
import { Rest } from "ably";
import { getMeetingSessionCipherKey } from "@/services";
import type { Avatar, NewMeetingSession } from "@/lib/db/schema";
import type { OpenAIChatMessage } from "@/lib/types";

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

  const meetingLink = generateShortUUID();
  try {
    const cipherKey = await Rest.Crypto.generateRandomKey();
    const newMeetingSession: NewMeetingSession = {
      userId: user.id,
      avatarId: avatar.id,
      meetingLink,
      cipherKey,
    };

    await db.insert(meetingSessions).values(newMeetingSession);
  } catch (error) {
    console.error(error);
    return { message: "Error creating session" };
  }

  redirect(`/therapist/${meetingLink}`);
}

export async function transcribeAndBroadcast(
  audioFile: File,
  meetingLink: string
) {
  if (!meetingLink || !audioFile) return;

  const transcribe = await openAI.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  const cipherKey = await getMeetingSessionCipherKey(meetingLink);

  if (!cipherKey) {
    console.error("Cipher key not found for meeting link:", meetingLink);
    throw new Error("Failed to get cipher key");
  }

  await ablyRest.channels
    .get(`meeting:${meetingLink}`, { cipher: { key: cipherKey } })
    .publish("transcript", { transcribedText: transcribe.text });
}

export async function getLLMResponse(
  message: string,
  conversationHistory: OpenAIChatMessage[],
  systemPrompt?: string
) {
  const initialInstruction = "You are role-playing as ";
  const llmInstructions =
    "Your response will be spoken so do not add extra text other than your response. Respond naturally.";

  // Check if system message is present; if not, add it to the beginning of the history
  if (!conversationHistory.some((msg) => msg.role === "system")) {
    const systemMessage: OpenAIChatMessage = {
      role: "system",
      content: systemPrompt
        ? `${initialInstruction} ${systemPrompt} ${llmInstructions}`
        : llmInstructions,
    };
    conversationHistory.unshift(systemMessage); // Add system message at the start of the conversation
  }

  // Add user's message to the conversation history
  conversationHistory.push({ role: "user", content: message });

  try {
    // Call the OpenAI API with the complete conversation history
    const completion = await openAI.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: conversationHistory,
    });

    const assistantResponse = completion.choices[0]?.message?.content;
    return assistantResponse ?? "No Response";
  } catch (error) {
    console.error("Error communicating with OpenAI API:", error);
    return "An error occurred while getting a response from the LLM.";
  }
}
