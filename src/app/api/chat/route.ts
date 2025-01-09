import { NextResponse } from "next/server";
import { openAI } from "@/lib/integrations/openai";
import { getToneInstruction } from "@/lib/LLMTones";
import { validateRequest } from "@/lib/auth";
import type { OpenAIChatMessage } from "@/lib/types";
import type { ChatModel } from "openai/resources/index.mjs";

interface PromptData {
  message: string;
  conversationHistory: OpenAIChatMessage[];
  therapistPersona: string; // e.g. "the wife in a couples therapy session with the user (your husband)"
  tone?: string;
  model?: ChatModel;
}

export async function POST(req: Request) {
  // Validate user
  const { session } = await validateRequest();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  // 1. Parse the request body -- TODO: add zod validation
  const { message, conversationHistory, therapistPersona, tone, model }: PromptData =
    await req.json();

  // 2) add system messages if missing
  // Predefined stable instructions that the therapist does not have to worry about.
  const personaInstructions = `${process.env.PERSONA_INSTRUCTIONS} Persona: ${therapistPersona}.`;
  const personaMessage: OpenAIChatMessage = {
    role: "system",
    content: personaInstructions,
  };

  // Style and tone instructions remain stable and separate:
  const styleMessage: OpenAIChatMessage = {
    role: "developer",
    content: `You are generating responses intended to be spoken aloud by a Text-to-Speech (TTS) system. 
  Ensure your output contains only content that can be verbalized naturally. Avoid including any meta commentary, such as descriptions of actions, sounds, or non-verbal expressions (e.g., sighs deeply, laughs). 
  Focus on producing clear, conversational, and natural speech suitable for direct verbalization. ${getToneInstruction(
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

  // Create a TextEncoder for streaming partial content
  const encoder = new TextEncoder();

  // 3. Set up a ReadableStream to pass data back to the client in chunks
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 4. Call OpenAI with `stream: true`
        const response = await openAI.chat.completions.create({
          model: model ?? "gpt-4o-2024-11-20",
          messages: conversationHistory,
          stream: true,
        });

        let fullResponse = "";

        // 5. Read the chunks from the response
        for await (const chunk of response as any) {
          // Each chunk is a ChatCompletionChunk object, not raw bytes
          // So we can access chunk.choices[].delta.content directly
          const content = chunk?.choices?.[0]?.delta?.content;
          if (!content) continue; // sometimes there's no `content` (e.g., "role" tokens)

          // Accumulate into fullResponse if you need the entire text later
          fullResponse += content;

          // Stream partial text back to the client
          controller.enqueue(encoder.encode(content));
        }

        // 6. Once finished, we have the entire text in `fullResponse` if needed:
        // console.log("Full LLM Response:", fullResponse);

        // 7. Close the stream
        controller.close();
      } catch (error) {
        console.error(error);
        controller.enqueue(encoder.encode("Error occurred: " + String(error)));
        controller.close();
      }
    },
  });

  // 8. Return a streaming response (SSE-like)
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
