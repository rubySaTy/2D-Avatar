"use client";

import { useState } from "react";
import { SubmitButton } from "./SubmitButton";
import { Textarea } from "./ui/textarea";
import { Button } from "@/components/ui/button";
import { createTalkStream } from "@/app/actions";
import PremadeMessages from "./PremadeMessages";
import VoiceSelector from "./VoiceSelector";
import type { Voice } from "@/lib/types";

interface InputAreaProps {
  meetingLink: string;
  VoiceSelectorProps: {
    voices: Voice[];
    genders: string[];
    languages: string[];
  };
}

export default function InputArea({
  meetingLink,
  VoiceSelectorProps,
}: InputAreaProps) {
  const [message, setMessage] = useState("");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const submitMessageWithId = createTalkStream.bind(null, meetingLink);

  return (
    <>
      <form action={submitMessageWithId}>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your message here."
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <input type="hidden" name="providerType" value="microsoft" />
          <input type="hidden" name="voiceId" value={selectedVoice?.id || ""} />
          <input type="hidden" name="voiceStyle" value={selectedStyle || ""} />
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
      </form>
      <VoiceSelector
        voices={VoiceSelectorProps.voices}
        genders={VoiceSelectorProps.genders}
        languages={VoiceSelectorProps.languages}
        selectedGender={selectedGender}
        selectedLanguage={selectedLanguage}
        selectedVoice={selectedVoice}
        selectedStyle={selectedStyle}
        onGenderChange={setSelectedGender}
        onLanguageChange={setSelectedLanguage}
        onVoiceChange={setSelectedVoice}
        onStyleChange={setSelectedStyle}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <PremadeMessages setMessage={setMessage} />
      </div>
    </>
  );
}
