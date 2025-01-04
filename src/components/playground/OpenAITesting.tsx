"use client";

import { useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transcribe } from "@/app/actions";
import { transcribedTextSchema } from "@/lib/validationSchema";
import { Loader2 } from "lucide-react";
import { StyleSelector } from "@/components/therapist/therapist-session-panel/StyleSelector";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { useLLMResponse } from "@/hooks/useLLMResponse";
import type { ChatModel } from "openai/resources/index.mjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const llmModels: ChatModel[] = [
  "gpt-4o",
  "gpt-4o-2024-11-20",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-05-13",
  "chatgpt-4o-latest",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-0125-preview",
  "gpt-4-turbo-preview",
  "gpt-4-1106-preview",
  "gpt-4",
];

interface MessageHistory {
  type: "incoming" | "outgoing";
  content: string;
  timestamp: string;
}

const EXAMPLE_SYSTEM_PROMPT =
  "A 30-year-old wife named Sarah in marriage counseling, who feels hurt due to her husband’s emotional distance. She’s empathetic but needs to express her feelings more assertively so that he understands how neglected she feels. She genuinely loves him but is frustrated by his lack of engagement.";

export default function OpenAITesting() {
  const [therapistPersona, setTherapistPersona] = useState("");

  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);
  const [llmPartialResponse, setLlmPartialResponse] = useState("");

  const [llmModel, setLLMModel] = useState<ChatModel | string>();
  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);

  const { history, llmHistory, addHistoryMessage, addLLMHistoryMessage } =
    useMessageHistory();

  const { isGenerating, generateResponse, regenerateResponse } = useLLMResponse({
    therapistPersona,
    style: selectedStyle,
    intensity: styleIntensity,
  });

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

    addHistoryMessage(transcribedText, "incoming");
    addLLMHistoryMessage(transcribedText, "user");

    // Here we generate the response, showing partial tokens
    const llmResponse = await generateResponse(
      transcribedText,
      llmHistory,
      (token) => {
        // This callback fires on each partial chunk
        setLlmPartialResponse((prev) => prev + token);
      },
      llmModel
    );

    // Once done, we push the final result into our LLM history
    addLLMHistoryMessage(llmResponse, "assistant");
    setHasIncomingLLMResponse(true);

    addHistoryMessage(llmResponse, "outgoing");
    // Clear out partialResponse for next time (or keep it around if you want to display it)
    setLlmPartialResponse("");
  }

  async function handleRegenerate() {
    setLlmPartialResponse("");
    const llmResponse = await regenerateResponse(
      llmHistory,
      (token) => {
        setLlmPartialResponse((prev) => prev + token);
      },
      llmModel
    );

    addLLMHistoryMessage(llmResponse, "assistant");
    setHasIncomingLLMResponse(true);

    addHistoryMessage(llmResponse, "outgoing");
    setLlmPartialResponse("");
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
      alert("Could not start recording. Please check your microphone permissions.");
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
                value={llmPartialResponse}
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
                    disabled={isGenerating}
                    onClick={handleRegenerate}
                  >
                    {isGenerating ? (
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
      <div className="flex items-center space-x-4">
        <Select value={llmModel} onValueChange={setLLMModel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {llmModels.length > 0 ? (
              llmModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-models">No models available</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
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
