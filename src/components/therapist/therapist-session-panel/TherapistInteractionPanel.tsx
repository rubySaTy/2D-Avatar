"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import VoiceSelector from "./VoiceSelector";
import { submitMessageToDID } from "@/app/actions/d-id";
import { useChannel } from "ably/react";
import { transcribedTextSchema } from "@/lib/validationSchema";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { useLLMResponse } from "@/hooks/useLLMResponse";
import { LLMPersonaPrompt } from "./LLMPersonaPrompt";
import LLMTextarea from "@/components/LLMTextArea";
import { getMeetingStatusAction } from "@/app/actions/meetingSession";
import { logMessage } from "@/app/actions";
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
  const [message, setMessage] = useState("");
  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);
  const [shouldSubmitForm, setShouldSubmitForm] = useState(false);
  const [isWebrtcConnected, setIsWebrtcConnected] = useState(false);
  const [isVideoStreaming, setIsVideoStreaming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { history, llmHistory, addHistoryMessage, addLLMHistoryMessage } =
    useMessageHistory();

  const { isGenerating, generateResponse, regenerateResponse } = useLLMResponse({
    personaPrompt,
    style: selectedStyle,
    intensity: styleIntensity,
  });

  const handleStyleSelect = (style: string, intensity: number) => {
    setSelectedStyle(style);
    setStyleIntensity(intensity);
  };

  // Getting the status of the WebRTC connection when initially loading the component
  useEffect(() => {
    getMeetingStatusAction(meetingLink).then((isConnected) => {
      logMessage(`Therapist webrtc-status: isConnected-${isConnected}`);
      setIsWebrtcConnected(isConnected ?? false);
    });
  }, [meetingLink]);

  useChannel(`meeting:${meetingLink}`, async (ablyMessage) => {
    if (ablyMessage.name === "webrtc-status") {
      logMessage(`Therapist webrtc-status: isConnected-${ablyMessage.data.isConnected}`);
      setIsWebrtcConnected(ablyMessage.data.isConnected);
      if (ablyMessage.data.isConnected === false) setIsVideoStreaming(false);
      return;
    }

    if (ablyMessage.name === "stream/started") {
      logMessage("Therapist received stream/started");
      setIsVideoStreaming(true);
      return;
    }

    if (ablyMessage.name === "stream/done") {
      logMessage("Therapist received stream/done");
      addHistoryMessage(message, "outgoing");
      setMessage("");
      setIsVideoStreaming(false);
      return;
    }

    const res = transcribedTextSchema.safeParse(ablyMessage.data.transcribedText);
    if (!res.success) {
      console.warn("Invalid transcribed text:", ablyMessage.data.transcribedText);
      return;
    }
    const transcribedText = res.data;

    addHistoryMessage(transcribedText, "incoming");
    addLLMHistoryMessage(transcribedText, "user");

    // Here we generate the response, showing partial tokens
    const llmResponse = await generateResponse(transcribedText, llmHistory, (token) => {
      // This callback fires on each partial chunk
      setMessage((prev) => prev + token);
    });

    // Once done, we push the final result into our LLM history
    addLLMHistoryMessage(llmResponse, "assistant");
    setHasIncomingLLMResponse(true);

    // Signal that we're ready to submit the form
    setShouldSubmitForm(true);
  });

  async function handleRegenerate() {
    setMessage("");
    const llmResponse = await regenerateResponse(llmHistory, (token) => {
      setMessage((prev) => prev + token);
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
    }
  }, [shouldSubmitForm]);

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

            <LLMTextarea
              message={message}
              setMessage={setMessage}
              isConnected={isWebrtcConnected}
              isGenerating={isGenerating}
              isPending={isPending}
              isVideoStreaming={isVideoStreaming}
              handleRegenerate={handleRegenerate}
              handleStyleSelect={handleStyleSelect}
              hasIncomingLLMResponse={hasIncomingLLMResponse}
              setHasIncomingLLMResponse={setHasIncomingLLMResponse}
            />

            {state?.message && !state.success && (
              <div className="text-red-600">{state.message}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
