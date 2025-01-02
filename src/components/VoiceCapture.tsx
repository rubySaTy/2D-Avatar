"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { transcribeAndBroadcast } from "@/app/actions";

export default function VoiceCapture({ meetingLink }: { meetingLink: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder is not supported in this browser.");
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        stream.getTracks().forEach((track) => track.stop());

        const audioFile = new File([audioBlob], "recording.wav", {
          type: "audio/wav",
        });

        try {
          await transcribeAndBroadcast(audioFile, meetingLink);
        } catch (transcribeError) {
          console.error("Transcription failed:", transcribeError);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.warn("Error accessing microphone:", error);
      alert("Could not start recording. Please check your microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Button
      onClick={isRecording ? stopRecording : startRecording}
      variant={isRecording ? "destructive" : "default"}
    >
      {isRecording ? "Stop Recording" : "Start Recording"}
    </Button>
  );
}
