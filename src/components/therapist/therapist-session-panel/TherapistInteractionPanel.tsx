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
import { LLMPersonaPrompt } from "./LLMPersonaPrompt";
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

export default function TherapistInteractionPanel({
  meetingLink,
  VoiceSelectorProps,
}: TherapistInteractionPanelProps) {
  const [state, formAction, isPending] = useActionState(submitMessageToDID, null);
  const [personaPrompt, setPersonaPrompt] = useState("");

  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);
  // Use this to track when we're ready to submit
  const [shouldSubmitForm, setShouldSubmitForm] = useState(false);

  const { history, llmHistory, addHistoryMessage, addLLMHistoryMessage } =
    useMessageHistory();

  const { isGenerating, generateResponse, regenerateResponse } = useLLMResponse({
    personaPrompt,
    style: selectedStyle,
    intensity: styleIntensity,
  });

  const [llmPartialResponse, setLlmPartialResponse] = useState("");

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

    // Here we generate the response, showing partial tokens
    const llmResponse = await generateResponse(transcribedText, llmHistory, (token) => {
      // This callback fires on each partial chunk
      setLlmPartialResponse((prev) => prev + token);
    });

    // Once done, we push the final result into our LLM history
    addLLMHistoryMessage(llmResponse, "assistant");
    setHasIncomingLLMResponse(true);

    // Signal that we're ready to submit the form
    setShouldSubmitForm(true);
  });

  async function handleRegenerate() {
    setLlmPartialResponse("");
    const llmResponse = await regenerateResponse(llmHistory, (token) => {
      setLlmPartialResponse((prev) => prev + token);
    });

    addLLMHistoryMessage(llmResponse, "assistant");
    setHasIncomingLLMResponse(true);

    setShouldSubmitForm(true);
  }

  // Watch for when we should submit the form
  useEffect(() => {
    if (shouldSubmitForm && formRef.current) {
      formRef.current.requestSubmit();
      setShouldSubmitForm(false); // Reset for next time

      // Clear out partialResponse for next time
      setLlmPartialResponse("");
    }
  }, [shouldSubmitForm]);

  useEffect(() => {
    if (state?.success && state.message) {
      addHistoryMessage(state.message, "outgoing");
    }
  }, [state]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4 space-y-8">
          <LLMPersonaPrompt
            therapistPersona={personaPrompt}
            setTherapistPersona={setPersonaPrompt}
          />

          {/* Form that sends message to D-ID */}
          <form action={formAction} className="space-y-6" ref={formRef}>
            <input type="hidden" name="meetingLink" value={meetingLink} />
            <input type="hidden" name="voiceStyle" value={selectedStyle} />

            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={llmPartialResponse}
                  onChange={(e) => setLlmPartialResponse(e.target.value)}
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
                      disabled={isGenerating || isPending}
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
                    setLlmPartialResponse("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            {state?.message && !state.success && (
              <div className="text-red-600">{state.message}</div>
            )}

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
                    <p className="text-xs text-muted-foreground mt-1">{msg.timestamp}</p>
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
