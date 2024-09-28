"use client";

import { useState } from "react";
import { SubmitButton } from "./SubmitButton";
import { Textarea } from "./ui/textarea";
import { Button } from "@/components/ui/button";
import { createTalkStream } from "@/app/actions";
import PremadeMessages from "./PremadeMessages";

interface InputAreaProps {
  streamId: string;
  sessionId: string;
}

export default function InputArea({ sessionId, streamId }: InputAreaProps) {
  const [message, setMessage] = useState("");
  const submitMessageWithId = createTalkStream.bind(null, streamId, sessionId);

  const addPremadeMessage = (premadeMessage: string) => {
    setMessage((prevMessage) =>
      prevMessage ? `${prevMessage}\n${premadeMessage}` : premadeMessage
    );
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <PremadeMessages addPremadeMessage={addPremadeMessage}/>
      </div>
    </>
  );
}
