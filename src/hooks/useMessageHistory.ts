import { useState } from "react";
import { getMessageTimestamp } from "@/lib/utils";
import type { MessageHistory, OpenAIChatMessage } from "@/lib/types";

export function useMessageHistory() {
  const [history, setHistory] = useState<MessageHistory[]>([]); // for all messages
  const [llmHistory, setLLMHistory] = useState<OpenAIChatMessage[]>([]); // for llm context

  const addHistoryMessage = (content: string, type: MessageHistory["type"]) => {
    const newMessage: MessageHistory = {
      type,
      content,
      timestamp: getMessageTimestamp(),
    };

    setHistory((prev) => [...prev, newMessage]);
  };

  const addLLMHistoryMessage = (content: string, role: OpenAIChatMessage["role"]) => {
    const newLLMMessage: OpenAIChatMessage = {
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
