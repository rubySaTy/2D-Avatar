"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubmitButton } from "@/components/SubmitButton";
import VoiceSelector from "./VoiceSelector";
import { getMessageTimestamp } from "@/lib/utils";
import { submitMessageToDID } from "@/app/actions/d-id";
import PremadeMessages from "./PremadeMessages";
import { useChannel } from "ably/react";
import { getLLMResponse } from "@/app/actions";
import { transcribedTextSchema } from "@/lib/validationSchema";
import { StyleSelector } from "./StyleSelector";
import { Loader2 } from "lucide-react";
import type { MicrosoftVoice, OpenAIChatMessage } from "@/lib/types";

interface TherapistInteractionPanelProps {
  meetingLink: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
  };
}

interface MessageHistory {
  type: "incoming" | "outgoing";
  content: string;
  timestamp: string;
}

const EXAMPLE_SYSTEM_PROMPT =
  "A 30-year-old wife named Sarah in marriage counseling, who feels hurt due to her husband’s emotional distance. She’s empathetic but needs to express her feelings more assertively so that he understands how neglected she feels. She genuinely loves him but is frustrated by his lack of engagement.";

export default function TherapistInteractionPanel({
  meetingLink,
  VoiceSelectorProps,
}: TherapistInteractionPanelProps) {
  const [history, setHistory] = useState<Array<MessageHistory>>([]);
  const [state, formAction] = useActionState(submitMessageToDID, null);

  const [therapistPersona, setTherapistPersona] = useState("");
  const [LLMConversationHistory, setLLMConversationHistory] = useState<
    Array<OpenAIChatMessage>
  >([]);
  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);
  const [isRegeneratingAnswer, setIsRegeneratingAnswer] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);

  const handleStyleSelect = (style: string, intensity: number) => {
    setSelectedStyle(style);
    setStyleIntensity(intensity);
  };

  useChannel(`meeting:${meetingLink}`, async (message) => {
    const res = transcribedTextSchema.safeParse(message.data.transcribedText);

    if (!res.success) {
      console.warn("Invalid transcribed text:", message.data.transcribedText);
      return;
    }
    const transcribedText = res.data;

    const timestamp = getMessageTimestamp();
    setHistory((history) => [
      ...history,
      {
        type: "incoming",
        content: transcribedText,
        timestamp,
      },
    ]);

    const newMessage: OpenAIChatMessage = {
      role: "user",
      content: transcribedText,
    };
    const updatedHistory = [...LLMConversationHistory, newMessage];

    setLLMConversationHistory(updatedHistory);

    const llmResponse = await getLLMResponse(
      transcribedText,
      LLMConversationHistory,
      therapistPersona,
      `${selectedStyle}:${styleIntensity}`
    );

    const assistantMessage: OpenAIChatMessage = {
      role: "assistant",
      content: llmResponse,
    };

    if (messageRef.current && formRef.current) {
      setLLMConversationHistory((prev) => [...prev, assistantMessage]);
      messageRef.current.value = llmResponse;
      setHasIncomingLLMResponse(true);

      formRef.current.requestSubmit();
    }
  });

  async function handleRegenerate() {
    // 1) Clone the conversation history so we don’t modify the original
    const tempLLMHistory = [...LLMConversationHistory];

    // 2) Add a one-time system message to request a different response
    tempLLMHistory.push({
      role: "system",
      content:
        "Please ignore your previous assistant response. Provide a new answer to the last user message, keeping the same context and persona but taking a different approach.",
    });

    // 3) Call getLLMResponse with the temporary history
    const newAssistantReply = await getLLMResponse(
      // Pass in empty or the same user message, depending on your implementation
      "",
      tempLLMHistory,
      therapistPersona, // or undefined if persona is already in conversation
      `${selectedStyle}:${styleIntensity}` // or undefined if tone is already in conversation
    );

    // 4) Add the new assistant message to the *official* conversation
    const assistantMessage: OpenAIChatMessage = {
      role: "assistant",
      content: newAssistantReply,
    };

    LLMConversationHistory.push({
      role: "assistant",
      content: newAssistantReply,
    });

    // Now you can display or handle `newAssistantReply` in your UI
    if (messageRef.current && formRef.current) {
      setLLMConversationHistory((prev) => [...prev, assistantMessage]);
      messageRef.current.value = newAssistantReply;
      setHasIncomingLLMResponse(true);

      formRef.current.requestSubmit();
    }
  }

  useEffect(() => {
    if (state?.success) {
      const timestamp = getMessageTimestamp();

      const newMessage: MessageHistory = {
        type: "outgoing",
        content: `${state.message}`,
        timestamp,
      };
      setHistory((history) => [...history, newMessage]);

      if (formRef.current) formRef.current.reset();
    }
  }, [state]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4 space-y-8">
          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-semibold">System Prompt</h2>
            <Textarea
              value={therapistPersona}
              onChange={(e) => setTherapistPersona(e.target.value)}
              placeholder={`Example: ${EXAMPLE_SYSTEM_PROMPT}`}
              className="min-h-[100px] text-base resize-none"
            />
          </div>
          <form action={formAction} className="space-y-6" ref={formRef}>
            <input type="hidden" name="meetingLink" value={meetingLink} />
            <input type="hidden" name="voiceStyle" value={selectedStyle} />

            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  ref={messageRef}
                  placeholder="Type your message here."
                  id="message"
                  name="message"
                  className="min-h-[150px] text-lg pr-28"
                />
                <StyleSelector onStyleSelect={handleStyleSelect} />
              </div>
              <div className="flex justify-between">
                <div className="space-x-2">
                  <SubmitButton>Send Message</SubmitButton>
                  {hasIncomingLLMResponse && (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isRegeneratingAnswer}
                      onClick={async () => {
                        setIsRegeneratingAnswer(true);
                        await handleRegenerate();
                        setIsRegeneratingAnswer(false);
                      }}
                    >
                      {isRegeneratingAnswer ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating LLM Response...
                        </>
                      ) : (
                        "Regenerate LLM Response"
                      )}
                    </Button>
                  )}
                </div>
                <Button
                  type="reset"
                  variant="outline"
                  onClick={() => {
                    setHasIncomingLLMResponse(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
            {!state?.success && state?.message}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PremadeMessages />
              <Card>
                <CardHeader>
                  <CardTitle>Voice Selector</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <VoiceSelector
                      {...VoiceSelectorProps}
                      selectedStyle={selectedStyle}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
        <MessageHistory history={history} />
      </div>
    </div>
  );
}

function MessageHistory({ history }: { history: MessageHistory[] }) {
  return (
    <Card className="w-full lg:w-1/3">
      <CardHeader>
        <CardTitle>Message History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4">
            {history.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.type === "incoming" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    msg.type === "incoming" ? "flex-row" : "flex-row-reverse"
                  }`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      msg.type === "incoming"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-green-100 text-green-900"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
