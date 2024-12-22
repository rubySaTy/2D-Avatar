import { useState } from "react";
import { getLLMResponse } from "@/app/actions";
import { OpenAIChatMessage } from "@/lib/types";

interface LLMConfig {
  therapistPersona: string;
  style: string;
  intensity: number;
}

export function useLLMResponse(config: LLMConfig) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateResponse = async (
    message: string,
    history: OpenAIChatMessage[]
  ) => {
    setIsGenerating(true);
    try {
      const response = await getLLMResponse(
        message,
        history,
        config.therapistPersona,
        `${config.style}:${config.intensity}`
      );
      return response;
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateResponse = async (history: OpenAIChatMessage[]) => {
    const tempHistory: OpenAIChatMessage[] = [
      ...history,
      {
        role: "system",
        content:
          "Please ignore your previous assistant response. Provide a new answer to the last user message, keeping the same context and persona but taking a different approach.",
      },
    ];

    return generateResponse("", tempHistory);
  };

  return {
    isGenerating,
    generateResponse,
    regenerateResponse,
  };
}
