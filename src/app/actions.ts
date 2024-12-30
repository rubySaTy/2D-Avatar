"use server";

import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { openAI } from "@/lib/integrations/openai";
import { ablyRest } from "@/lib/integrations/ably";
import { createNewMeetingSession, getMeetingSessionCipherKey } from "@/services";
import { getToneInstruction } from "@/lib/LLMTones";
import { avatarIdSchema } from "@/lib/validationSchema";
import type { OpenAIChatMessage } from "@/lib/types";

export async function createSession(prevState: any, formData: FormData) {
  const res = avatarIdSchema.safeParse(formData.get("avatar-id"));
  if (!res.success) return { success: false, message: res.error.message };
  const avatarId = res.data;

  const currentUser = await getUser();
  if (!currentUser) return { success: false, message: "unauthorized" };

  let meetingLink: string | null = null;
  try {
    meetingLink = await createNewMeetingSession(currentUser.id, avatarId);
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error creating session" };
  }

  redirect(`/therapist/${meetingLink}`);
}

export async function transcribeAndBroadcast(audioFile: File, meetingLink: string) {
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
  therapistPersona: string, // e.g. "the wife in a couples therapy session with the user (your husband)"
  tone?: string
) {
  // Predefined stable instructions that the therapist does not have to worry about.
  const personaInstructions = `${process.env.PERSONA_INSTRUCTIONS} Persona: ${therapistPersona}.`;
  const personaMessage: OpenAIChatMessage = {
    role: "system",
    content: personaInstructions,
  };

  // Style and tone instructions remain stable and separate:
  const styleMessage: OpenAIChatMessage = {
    role: "system",
    content: `Your response will be spoken as if out loud. Do not add meta commentary. ${getToneInstruction(
      tone
    )}`,
  };

  // Check if persona instructions are already present
  const hasPersona = conversationHistory.some(
    (msg) => msg.role === "system" && msg.content.includes("You are role-playing")
  );

  // Check if style instructions are already present
  const hasStyle = conversationHistory.some(
    (msg) => msg.role === "system" && msg.content.includes("Your response will be spoken")
  );

  // Prepend system messages if missing
  if (!hasPersona) conversationHistory.unshift(personaMessage);
  if (!hasStyle) conversationHistory.unshift(styleMessage);

  // Add the user's new message
  conversationHistory.push({ role: "user", content: message });

  try {
    const completion = await openAI.chat.completions.create({
      model: "gpt-4o-2024-11-20",
      messages: conversationHistory,
    });

    return completion.choices[0]?.message?.content ?? "No response.";
  } catch (error) {
    console.error("Error communicating with OpenAI API:", error);
    return "An error occurred while getting a response from the LLM.";
  }
}

export async function Transcribe(audioFile: File) {
  if (!audioFile) return;

  const transcribe = await openAI.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
  });

  return transcribe.text;
}
