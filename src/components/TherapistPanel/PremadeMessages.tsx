"use client";

import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

const messages = {
  positive: [
    "I hear you and agree with you.",
    "I fully understand you.",
    "I appreciate you and all that you have done.",
    "I support you what ever you do.",
    "I love you very much.",
    "Intrested.",
  ],
  constructive: [
    "I disagree with you.",
    "What you are saying is stupid.",
    "I don't believe you.",
    "I don't trust you.",
    "Stop dwelling on this issue.",
    "I am not interested in having this conversation.",
    "I don't love you.",
  ],
};

export default function PremadeMessages() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(messages).map(([type, msgs]) => (
        <ScrollArea key={type} className="h-80 rounded-md border">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">
              {type.charAt(0).toUpperCase() + type.slice(1)} Messages
            </h4>
            {msgs.map((msg, index) => (
              <Button
                key={index}
                type="submit"
                name="premadeMessage"
                value={msg}
                variant="ghost"
                className={`w-full justify-start ${
                  type === "positive"
                    ? "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                    : "text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                }`}
              >
                <span className="truncate">{msg}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      ))}
    </div>
  );
}
