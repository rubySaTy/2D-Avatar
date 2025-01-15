"use server";

import { openAI } from "@/lib/integrations/openai";

export async function transcribe(audioFile: File) {
  if (!audioFile) return;
  try {
    const transcribe = await openAI.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return transcribe.text;
  } catch (error) {
    console.error(error);
  }
}

export async function logMessage(message: string) {
  console.log(message);
}
