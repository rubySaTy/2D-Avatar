"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { SubmitButton } from "../SubmitButton";
import VoiceSelector from "./VoiceSelector";
import { getMessageTimestamp } from "@/lib/utils";
import { submitMessageToDID } from "@/app/actions/d-id";
import PremadeMessages from "./PremadeMessages";
import { useChannel } from "ably/react";
import { getLLMResponse } from "@/app/actions";
import { Check, RefreshCw } from "lucide-react";
import type { MicrosoftVoice, OpenAIChatMessage } from "@/lib/types";

interface TherapistInteractionPanelProps {
  meetingLink: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
  };
}

// Wrapper for submitting message with ID
const submitMessage = (meetingLink: string) => {
  return async (prevState: any, formData: FormData) => {
    const res = await submitMessageToDID(meetingLink, formData);
    return res;
  };
};

const englishTextRegex = /^[A-Za-z0-9\s.,!?()'";\-:@#$%&*]+$/;
const EXAMPLE_SYSTEM_PROMPT =
  "a wife named Sarah in a marriage counseling session. You are thoughtful, empathetic, but also assertive about your feelings and needs.";

export default function TherapistInteractionPanel({
  meetingLink,
  VoiceSelectorProps,
}: TherapistInteractionPanelProps) {
  const [history, setHistory] = useState([""]);
  const [state, formAction] = useActionState(submitMessage(meetingLink), null);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<OpenAIChatMessage>
  >([]);
  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement>(null);

  useChannel(`meeting:${meetingLink}`, async (message) => {
    const transcribedText = message.data.transcribedText;
    if (
      !transcribedText ||
      transcribedText.trim() === "" ||
      !englishTextRegex.test(transcribedText)
    ) {
      return;
    }

    const newMessage: OpenAIChatMessage = {
      role: "user",
      content: transcribedText,
    };
    const updatedHistory = [...conversationHistory, newMessage];

    setConversationHistory(updatedHistory);

    const llmResponse = await getLLMResponse(
      transcribedText,
      conversationHistory,
      systemPrompt
    );

    const assistantMessage: OpenAIChatMessage = {
      role: "assistant",
      content: llmResponse,
    };
    setConversationHistory((prev) => [...prev, assistantMessage]);

    if (messageRef.current) {
      messageRef.current.value = llmResponse;
      setHasIncomingLLMResponse(true);
    }
  });

  useEffect(() => {
    if (state?.success) {
      const timestamp = getMessageTimestamp();
      setHistory((history) => [...history, `${timestamp} - ${state.message}`]);

      if (messageRef.current) {
        messageRef.current.value = "";
      }
    }
  }, [state]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4 space-y-8">
          <div className="space-y-2 mb-6">
            <h2 className="text-lg font-semibold">System Prompt</h2>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder={`Example: ${EXAMPLE_SYSTEM_PROMPT}`}
              className="min-h-[100px] text-base resize-none"
            />
          </div>
          <form
            action={(formData) => {
              formAction(formData);
              setHasIncomingLLMResponse(false);
            }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Textarea
                ref={messageRef}
                placeholder="Type your message here."
                id="message"
                name="message"
                className="min-h-[150px] text-lg"
              />
              <div className="flex justify-between">
                {!hasIncomingLLMResponse && (
                  <SubmitButton>Send Message</SubmitButton>
                )}
                {hasIncomingLLMResponse && (
                  <div className="space-x-2">
                    <SubmitButton className="bg-green-500 hover:bg-green-600 text-white">
                      <Check className="w-4 h-4 mr-2" />
                      Accept & Speak Message
                    </SubmitButton>
                    <Button type="button" variant="destructive">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Text
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (messageRef.current) {
                      messageRef.current.value = "";
                      setHasIncomingLLMResponse(false);
                    }
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
                    <VoiceSelector {...VoiceSelectorProps} />
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

function MessageHistory({ history }: { history: string[] }) {
  return (
    <>
      <Card className="w-full lg:w-1/4">
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((msg, index) => (
              <div key={index} className="p-3 rounded-lg bg-muted">
                <p className="text-sm">{msg}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
