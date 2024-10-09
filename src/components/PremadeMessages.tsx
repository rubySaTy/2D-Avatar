"use client";

import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const positiveMessages = [
  "I hear you and agree with you.",
  "I fully understand you.",
  "I appreciate you and all that you have done.",
  "I support you what ever you do.",
  "I love you very much.",
  "Intrested.",
];

const constructiveFeedback = [
  "I disagree with you.",
  "What you are saying is stupid.",
  "I don't believe you.",
  "I don't trust you.",
  "Stop dwelling on this issue.",
  "I am not interested in having this conversation.",
  "I don't love you.",
  "I hate you.",
  "You are fired.",
  "I am leaving you.",
];

interface PremadeMessagesProps {
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

export default function PremadeMessages({ setMessage }: PremadeMessagesProps) {
  const addPremadeMessage = (premadeMessage: string) => {
    setMessage((prevMessage) =>
      prevMessage ? `${prevMessage}\n${premadeMessage}` : premadeMessage
    );
  };
  return (
    <>
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
    </>
  );
}
