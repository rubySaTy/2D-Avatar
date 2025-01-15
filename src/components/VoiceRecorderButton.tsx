"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { transcribeAndBroadcastAction } from "@/app/actions/meetingSession";
import { MicOff, Mic } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderButtonProps {
  meetingLink: string;
  disabled: boolean;
}

export function VoiceRecorderButton({ meetingLink, disabled }: VoiceRecorderButtonProps) {
  const { toast } = useToast();

  // Pass in a callback that handles what to do with the audioFile
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onRecordingComplete: async (audioFile: File) => {
      const warnMessage = await transcribeAndBroadcastAction(audioFile, meetingLink);

      if (warnMessage) {
        toast({
          title: "Error",
          description: warnMessage,
          variant: "destructive",
          duration: 5000,
        });
      }
    },
  });

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      onClick={handleRecordingToggle}
      size="sm"
      className={`flex items-center gap-2 ${
        isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
      } text-white`}
      disabled={disabled}
    >
      <motion.div
        animate={{
          scale: isRecording ? [1, 1.2, 1] : 1,
        }}
        transition={{
          scale: {
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1,
            ease: "easeInOut",
          },
        }}
      >
        {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
      </motion.div>
      <span className="hidden md:inline">
        {isRecording ? "Stop Recording" : "Start Recording"}
      </span>
    </Button>
  );
}
