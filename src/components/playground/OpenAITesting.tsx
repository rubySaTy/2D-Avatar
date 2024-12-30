"use client";

import { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMessageTimestamp } from "@/lib/utils";
import { getLLMResponse, Transcribe } from "@/app/actions";
import { transcribedTextSchema } from "@/lib/validationSchema";
import { Loader2 } from "lucide-react";
import { StyleSelector } from "../therapist/therapist-session-panel/StyleSelector";
import type { OpenAIChatMessage } from "@/lib/types";

interface MessageHistory {
  type: "incoming" | "outgoing";
  content: string;
  timestamp: string;
}

const EXAMPLE_SYSTEM_PROMPT =
  "A 30-year-old wife named Sarah in marriage counseling, who feels hurt due to her husband’s emotional distance. She’s empathetic but needs to express her feelings more assertively so that he understands how neglected she feels. She genuinely loves him but is frustrated by his lack of engagement.";

export default function OpenAITesting() {
  const [history, setHistory] = useState<Array<MessageHistory>>([]);
  const [therapistPersona, setTherapistPersona] = useState("");
  const [LLMConversationHistory, setLLMConversationHistory] = useState<
    Array<OpenAIChatMessage>
  >([]);
  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);
  const [isRegeneratingAnswer, setIsRegeneratingAnswer] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);

  const handleStyleSelect = (style: string, intensity: number) => {
    setSelectedStyle(style);
    setStyleIntensity(intensity);
  };

  async function sendMessage(content: string) {
    const res = transcribedTextSchema.safeParse(content);

    if (!res.success) {
      console.warn("Invalid transcribed text:", content);
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

    if (messageRef.current) {
      setLLMConversationHistory((prev) => [...prev, assistantMessage]);
      messageRef.current.value = llmResponse;
      setHasIncomingLLMResponse(true);

      const timestamp = getMessageTimestamp();

      const newMessage: MessageHistory = {
        type: "outgoing",
        content: llmResponse,
        timestamp,
      };
      setHistory((history) => [...history, newMessage]);
    }
  }

  async function handleRegenerate() {
    const tempLLMHistory = [...LLMConversationHistory];

    tempLLMHistory.push({
      role: "system",
      content:
        "Please ignore your previous assistant response. Provide a new answer to the last user message, keeping the same context and persona but taking a different approach.",
    });
    const newAssistantReply = await getLLMResponse(
      "",
      tempLLMHistory,
      therapistPersona,
      `${selectedStyle}:${styleIntensity}`
    );

    const assistantMessage: OpenAIChatMessage = {
      role: "assistant",
      content: newAssistantReply,
    };

    LLMConversationHistory.push(assistantMessage);

    if (messageRef.current) {
      setLLMConversationHistory((prev) => [...prev, assistantMessage]);
      messageRef.current.value = newAssistantReply;
      setHasIncomingLLMResponse(true);

      const timestamp = getMessageTimestamp();

      const newMessage: MessageHistory = {
        type: "outgoing",
        content: newAssistantReply,
        timestamp,
      };
      setHistory((history) => [...history, newMessage]);
    }
  }

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder is not supported in this browser.");
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        stream.getTracks().forEach((track) => track.stop());

        const audioFile = new File([audioBlob], "recording.wav", {
          type: "audio/wav",
        });

        try {
          const transcribedText = await Transcribe(audioFile);
          if (!transcribedText) return;
          sendMessage(transcribedText);
        } catch (transcribeError) {
          console.error("Transcription failed:", transcribeError);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.warn("Error accessing microphone:", error);
      alert(
        "Could not start recording. Please check your microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                ref={messageRef}
                className="min-h-[150px] text-lg pr-28"
                readOnly={true}
              />
              <StyleSelector onStyleSelect={handleStyleSelect} />
            </div>
            <div className="flex justify-between">
              <div className="space-x-2">
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
            </div>
          </div>
        </div>
        <MessageHistory history={history} />
      </div>
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? "destructive" : "default"}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
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
