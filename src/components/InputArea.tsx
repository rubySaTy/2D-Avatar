"use client";

import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { createTalkStream } from "@/app/actions";

interface InputAreaProps {
  streamId: string;
  sessionId: string;
}

export default function InputArea({ sessionId, streamId }: InputAreaProps) {
  const submitMessageWithId = createTalkStream.bind(null, streamId, sessionId);

  return (
    <form action={submitMessageWithId}>
      <Label htmlFor="message">Your Message</Label>
      <Textarea
        placeholder="Type your message here."
        id="message"
        name="message"
      />
      <Button type="submit">Send</Button>
    </form>
  );
}
