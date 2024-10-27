"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useFormState } from "react-dom";
import { createTalkStream } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { SubmitButton } from "./SubmitButton";
import VoiceSelector from "./VoiceSelector";
import PremadeMessages from "./PremadeMessages";
import type { MicrosoftVoice } from "@/lib/types";

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
    await createTalkStream(meetingLink, formData);
    return { success: true };
  };
};

export default function TherapistInteractionPanel({
  meetingLink,
  VoiceSelectorProps,
}: TherapistInteractionPanelProps) {
  const [message, setMessage] = useState("");
  const [state, formAction] = useFormState(submitMessage(meetingLink), null);

  // Reset message when form submission is successful
  // TODO: return status "success" to ensure only when successful
  useEffect(() => {
    if (state?.success) {
      setMessage("");
    }
  }, [state]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MessageArea message={message} setMessage={setMessage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice Selector</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <VoiceSelector {...VoiceSelectorProps} />
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export interface MessageAreaProps {
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
}

function MessageArea({ message, setMessage }: MessageAreaProps) {
  return (
    <>
      <div className="space-y-4">
        <Textarea
          placeholder="Type your message here."
          id="message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[150px]"
        />

        <div className="flex justify-between">
          <SubmitButton>Send Message</SubmitButton>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMessage("")}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <PremadeMessages setMessage={setMessage} />
      </div>
    </>
  );
}
