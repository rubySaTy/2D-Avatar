import { useState } from "react";
import { getMessageTimestamp } from "@/lib/utils";
import type { MessageHistory } from "@/lib/types";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export function useMessageHistory() {
  const [history, setHistory] = useState<MessageHistory[]>([]); // for all messages
  const [llmHistory, setLLMHistory] = useState<ChatCompletionMessageParam[]>([]); // for llm context

  const addHistoryMessage = (content: string, type: MessageHistory["type"]) => {
    const newMessage: MessageHistory = {
      type,
      content,
      timestamp: getMessageTimestamp(),
    };

    setHistory((prev) => [...prev, newMessage]);
  };

  const addLLMHistoryMessage = (
    content: string,
    role: "assistant" | "developer" | "system" | "user"
  ) => {
    const newLLMMessage: ChatCompletionMessageParam = {
      role,
      content,
    };
    setLLMHistory((prev) => [...prev, newLLMMessage]);
  };

  return {
    history,
    llmHistory,
    addHistoryMessage,
    addLLMHistoryMessage,
  };
}
