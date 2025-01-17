import { useEffect, useRef, useState, useActionState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { submitMessageToDID } from "@/app/actions/d-id";
import { useChannel } from "ably/react";
import { transcribedTextSchema } from "@/lib/validationSchema";
import { useMessageHistory } from "@/hooks/useMessageHistory";
import { useLLMResponse } from "@/hooks/useLLMResponse";
import { LLMPersonaPrompt } from "./LLMPersonaPrompt";
import LLMTextarea from "@/components/LLMTextArea";
import { getMeetingStatusAction } from "@/app/actions/meetingSession";
import { logMessage } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import TherapistPanelHeader from "./TherapistPanelHeader";
import VideoMeeting from "@/components/meeting/VideoMeeting";
import type { MessageHistory, MicrosoftVoice, VoiceList } from "@/lib/types";

interface TherapistInteractionPanelProps {
  therapistUsername: string;
  avatarImageUrl: string;
  avatarName: string;
  clientUrl: string;
  meetingLink: string;
  voiceList: VoiceList;
}

export default function TherapistInteractionPanel({
  therapistUsername,
  avatarName,
  avatarImageUrl,
  clientUrl,
  meetingLink,
  voiceList,
}: TherapistInteractionPanelProps) {
  const [state, formAction, isPending] = useActionState(submitMessageToDID, null);
  const [personaPrompt, setPersonaPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [hasIncomingLLMResponse, setHasIncomingLLMResponse] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [styleIntensity, setStyleIntensity] = useState(2);
  const [shouldSubmitForm, setShouldSubmitForm] = useState(false);
  const [isWebrtcConnected, setIsWebrtcConnected] = useState(false);
  const [isVideoStreaming, setIsVideoStreaming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { toast } = useToast();
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

  const handleVoiceSelect = (voice: MicrosoftVoice) => {
    setSelectedVoiceId(voice.id);
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
      toast({
        title: "Invalid Message",
        description:
          "The incoming message contains invalid text and cannot be processed.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    const transcribedText = res.data;

    addHistoryMessage(transcribedText, "incoming");
    addLLMHistoryMessage(transcribedText, "user");

    // Here we generate the response, showing partial tokens
    logMessage(`Generating LLM response for meeting link ${meetingLink}`);
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
    logMessage(`Regenerating LLM response for meeting link ${meetingLink}`);
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

  useEffect(() => {
    if (state?.message && !state.success) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive",
        duration: 7500,
      });
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <TherapistPanelHeader
        avatarImageUrl={avatarImageUrl}
        avatarName={avatarName}
        clientUrl={clientUrl}
        meetingLink={meetingLink}
      />

      {/* <VideoMeeting name={therapistUsername} room={meetingLink} /> */}

      <div className="mx-auto lg:w-1/2 w-full">
        <LLMPersonaPrompt
          therapistPersona={personaPrompt}
          setTherapistPersona={setPersonaPrompt}
        />
        <MessageHistory history={history} />

        {/* Form that sends message to D-ID */}
        <form action={formAction} className="sticky bottom-0" ref={formRef}>
          <input type="hidden" name="meeting-link" value={meetingLink} />
          <input type="hidden" name="voice-style" value={selectedStyle} />
          <input type="hidden" name="voice-id" value={selectedVoiceId} />

          <div>
            <LLMTextarea
              message={message}
              setMessage={setMessage}
              isConnected={isWebrtcConnected}
              isGenerating={isGenerating}
              isPending={isPending}
              isVideoStreaming={isVideoStreaming}
              handleRegenerate={handleRegenerate}
              handleStyleSelect={handleStyleSelect}
              handleVoiceSelect={handleVoiceSelect}
              hasIncomingLLMResponse={hasIncomingLLMResponse}
              setHasIncomingLLMResponse={setHasIncomingLLMResponse}
              voiceList={voiceList}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageHistory({ history }: { history: MessageHistory[] }) {
  return (
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
  );
}
