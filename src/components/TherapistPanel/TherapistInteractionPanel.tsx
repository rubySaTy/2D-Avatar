"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SubmitButton } from "@/components/SubmitButton";
import VoiceSelector from "./VoiceSelector";
import { submitMessageToDID } from "@/app/actions/d-id";
import PremadeMessages from "./PremadeMessages";
import { useChannel } from "ably/react";
import { transcribedTextSchema } from "@/lib/validationSchema";
import { StyleSelector } from "./StyleSelector";
import { Loader2 } from "lucide-react";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { useLLMResponse } from "@/hooks/useLLMResponse";
import type { MessageHistory, MicrosoftVoice } from "@/lib/types";

interface TherapistInteractionPanelProps {
  meetingLink: string;
  VoiceSelectorProps: {
    voices: MicrosoftVoice[];
    genders: string[];
    languages: string[];
    ageGroups: string[];
  };
}

const EXAMPLE_SYSTEM_PROMPT =
  "A 30-year-old wife named Sarah in marriage counseling, who feels hurt due to her husband’s emotional distance. She’s empathetic but needs to express her feelings more assertively so that he understands how neglected she feels. She genuinely loves him but is frustrated by his lack of engagement.";

export default function TherapistInteractionPanel({
  meetingLink,
  VoiceSelectorProps,
}: TherapistInteractionPanelProps) {
  const [state, formAction] = useActionState(submitMessageToDID, null);
  const [therapistPersona, setTherapistPersona] = useState("");

  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);

  const { history, llmHistory, addHistoryMessage, addLLMHistoryMessage } =
    useMessageHistory();

  const { isGenerating, generateResponse, regenerateResponse } = useLLMResponse(
    {
      therapistPersona,
      style: selectedStyle,
      intensity: styleIntensity,
    }
  );

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

    addHistoryMessage(transcribedText, "incoming");
    addLLMHistoryMessage(transcribedText, "user");

    const llmResponse = await generateResponse(transcribedText, llmHistory);

    addLLMHistoryMessage(llmResponse, "assistant");
    setHasIncomingLLMResponse(true);

    if (messageRef.current && formRef.current) {
      messageRef.current.value = llmResponse;
      formRef.current.requestSubmit();
    }
  });

  async function handleRegenerate() {
    const response = await regenerateResponse(llmHistory);

    addLLMHistoryMessage(response, "assistant");
    setHasIncomingLLMResponse(true);

    if (messageRef.current && formRef.current) {
      messageRef.current.value = response;
      formRef.current.requestSubmit();
    }
  }

  useEffect(() => {
    if (state?.success && state.message) {
      addHistoryMessage(state.message, "outgoing");

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
                      disabled={isGenerating}
                      onClick={handleRegenerate}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating Response...
                        </>
                      ) : (
                        "Regenerate Response"
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
