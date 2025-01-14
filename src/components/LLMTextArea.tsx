import React, { useRef, useEffect } from "react";
import { Send, RefreshCw, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StyleSelector } from "./therapist/therapist-session-panel/StyleSelector";

interface LLMTextareaProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  isGenerating: boolean;
  isConnected: boolean;
  isPending: boolean;
  hasIncomingLLMResponse: boolean;
  setHasIncomingLLMResponse: React.Dispatch<React.SetStateAction<boolean>>;
  handleRegenerate: () => void;
  handleStyleSelect: (style: string, intensity: number) => void;
}

export default function LLMTextarea({
  message,
  setMessage,
  isConnected,
  isGenerating,
  isPending,
  hasIncomingLLMResponse,
  setHasIncomingLLMResponse,
  handleRegenerate,
  handleStyleSelect,
}: LLMTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea with proper line height calculation
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      textarea.style.height = "auto";
      const newHeight = Math.min(
        Math.max(
          Math.ceil(textarea.scrollHeight / lineHeight) * lineHeight,
          56 // min height
        ),
        400 // max height
      );
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Resize listener
  useEffect(() => {
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, []);

  // Height adjustment based on message changes
  useEffect(() => {
    adjustHeight();
  }, [message]);

  return (
    <TooltipProvider>
      {/* max-w-3xl */}
      <div className="w-full mx-auto p-4">
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          {/* Style selector */}
          <div className="absolute top-2 left-2 z-10">
            <StyleSelector onStyleSelect={handleStyleSelect} />
          </div>

          {/* Connection status with pulse animation */}
          <div className="absolute top-2 right-2 z-10">
            <div
              className={`flex items-center ${
                isConnected ? "text-green-500" : "text-red-500"
              } text-xs font-medium opacity-60 hover:opacity-100 transition-opacity`}
            >
              <span className={`relative flex h-1.5 w-1.5 mr-1.5`}>
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  } opacity-75`}
                ></span>
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  } opacity-75 animate-ping`}
                ></span>
              </span>
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          {/* Textarea container */}
          <div className="relative mt-8">
            <textarea
              id="message"
              name="message"
              placeholder="Send a message..."
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                adjustHeight();
              }}
              className="w-full min-h-[56px] max-h-[400px] px-4 py-2 text-base resize-none rounded-2xl bg-transparent focus:outline-none dark:text-gray-100 custom-scrollbar"
              style={{
                marginBottom: "40px", // Height of the button container
                lineHeight: "1.5",
              }}
            />

            {/* Buttons container */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 p-1 bg-white dark:bg-gray-900">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    type="button"
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => {
                      setMessage("");
                      setHasIncomingLLMResponse(false);
                    }}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear message</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={!hasIncomingLLMResponse || isGenerating || isPending}
                    onClick={handleRegenerate}
                  >
                    <RefreshCw
                      className={`h-4 w-4 text-gray-500 ${
                        isGenerating ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isGenerating ? "Regenerating..." : "Regenerate response"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                    type="submit"
                    disabled={isPending || isGenerating || message.length === 0}
                  >
                    {!isPending && <Send className="h-4 w-4 text-white" />}
                    {isPending && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(155, 155, 155, 0.3) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(155, 155, 155, 0.3);
          border-radius: 20px;
          border: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(155, 155, 155, 0.5);
        }
      `}</style>
    </TooltipProvider>
  );
}
