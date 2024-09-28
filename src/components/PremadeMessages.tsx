"use client";

import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

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
interface PremadeMessagesProps {
  addPremadeMessage: (message: string) => void;
}

export default function PremadeMessages({
  addPremadeMessage,
}: PremadeMessagesProps) {
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
