import { useState } from "react";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

interface LLMConfig {
  personaPrompt: string;
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
    history: ChatCompletionMessageParam[],
    onToken?: (token: string) => void,
    model?: string
  ) => {
    setIsGenerating(true);

    const body = {
      message,
      conversationHistory: history,
      personaPrompt: config.personaPrompt,
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
        onToken?.(chunkValue);
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
   * Regenerate the last response, instructing the model to ignore
   * the previous assistant message. We keep the rest of the conversation,
   * and simply append a new system instruction to override the last assistant response.
   */
  const regenerateResponse = async (
    history: ChatCompletionMessageParam[],
    onToken?: (token: string) => void,
    model?: string
  ) => {
    // Insert a system message at the end telling the model to ignore previous assistant response
    const tempHistory: ChatCompletionMessageParam[] = [
      ...history,
      {
        role: "system",
        content:
          "Please ignore your previous assistant response. Provide a new answer to the last user message, keeping the same persona and context but taking a different approach.",
      },
    ];

    // Then we call generateResponse with an empty user message (or the same user message, etc.)
    return generateResponse("", tempHistory, onToken, model);
  };

  return {
    isGenerating,
    generateResponse,
    regenerateResponse,
  };
}
