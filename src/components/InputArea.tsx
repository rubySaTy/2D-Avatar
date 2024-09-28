"use client";

import { useState } from "react";
import { SubmitButton } from "./SubmitButton";
import { Textarea } from "./ui/textarea";
import { Button } from "@/components/ui/button";
import { createTalkStream } from "@/app/actions";
// import PremadeMessages from "./PremadeMessages";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

const positiveMessages = [
  "Great job!",
  "Keep up the good work!",
  "You're making excellent progress!",
  "I'm impressed with your dedication!",
  "Your effort is truly commendable!",
];

const constructiveFeedback = [
  "There's room for improvement.",
  "Let's discuss how we can do better.",
  "I think we need to reassess our approach.",
  "This doesn't meet our expectations.",
  "We should review this and make necessary changes.",
];

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
        {/* <PremadeMessages addPremadeMessage={addPremadeMessage}/> */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Positive Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full pr-4">
              {positiveMessages.map((msg, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start mb-2 text-left text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                  onClick={() => addPremadeMessage(msg)}
                >
                  <span className="truncate">{msg}</span>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Constructive Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full pr-4">
              {constructiveFeedback.map((msg, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start mb-2 text-left text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                  onClick={() => addPremadeMessage(msg)}
                >
                  <span className="truncate">{msg}</span>
                </Button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
