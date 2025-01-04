import { useState } from "react";
import type { OpenAIChatMessage } from "@/lib/types";

interface LLMConfig {
  therapistPersona: string;
  style: string;
  intensity: number;
}

export function useLLMResponse(config: LLMConfig) {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate a streaming response from the /api/chat route.
   * - message: user query or transcribed text
   * - history: conversation context
   * - onToken: optional callback to receive partial tokens as they stream in
   */
  const generateResponse = async (
    message: string,
    history: OpenAIChatMessage[],
    onToken?: (token: string) => void,
    model?: string
  ) => {
    setIsGenerating(true);

    const body = {
      message,
      conversationHistory: history,
      therapistPersona: config.therapistPersona,
      tone: `${config.style}:${config.intensity}`,
      model,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.body) {
        console.error("No response body found in streaming call");
        return "";
      }

      // Read the streamed response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode the chunk
        const chunkValue = decoder.decode(value);
        fullResponse += chunkValue;

        // If you want to show partial text to the user,
        // call onToken with this chunk
        if (onToken) {
          onToken(chunkValue);
        }
      }

      return fullResponse;
    } catch (error) {
      console.error("Error communicating with OpenAI API:", error);
      return "";
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Regenerate the last response with a new system directive
   * telling the model to ignore the previous assistant message.
   */
  const regenerateResponse = async (
    history: OpenAIChatMessage[],
    onToken?: (token: string) => void,
    model?: string
  ) => {
    // Add a special system message to disregard the last assistant response
    const tempHistory: OpenAIChatMessage[] = [
      ...history,
      {
        role: "system",
        content:
          "Please ignore your previous assistant response. Provide a new answer to the last user message, keeping the same context and persona but taking a different approach.",
      },
    ];

    // We send an empty user message, but preserve the conversation
    return generateResponse("", tempHistory, onToken, model);
  };

  return {
    isGenerating,
    generateResponse,
    regenerateResponse,
  };
}
