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
import { getMessageTimestamp } from "@/lib/utils";
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
    const res = await createTalkStream(meetingLink, formData);
    return res;
  };
};

export default function TherapistInteractionPanel({
  meetingLink,
  VoiceSelectorProps,
}: TherapistInteractionPanelProps) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([""]);
  const [state, formAction] = useFormState(submitMessage(meetingLink), null);

  useEffect(() => {
    if (state?.success) {
      setMessage("");
      const timestamp = getMessageTimestamp();
      setHistory((history) => [...history, `${timestamp} - ${state.message}`]);
    }
  }, [state]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4 space-y-6">
          <form action={formAction} className="space-y-6">
            <MessageArea message={message} setMessage={setMessage} />
            {!state?.success && state?.message}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PremadeMessages setMessage={setMessage} />
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
          className="min-h-[150px] text-lg"
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
    </>
  );
}

function MessageHistory({ history }: { history: string[] }) {
  return (
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
  );
}
