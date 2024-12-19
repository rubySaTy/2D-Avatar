"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { transcribeAndBroadcast } from "@/app/actions";

export default function VoiceCapture({ meetingLink }: { meetingLink: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder is not supported in this browser.");
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current.length = 0;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        // Stop all media stream tracks to free up system resources
        stream.getTracks().forEach((track) => track.stop());

        // Convert Blob to File
        const audioFile = new File([audioBlob], "recording.wav", {
          type: "audio/wav",
        });

        // sendAudioToServer(audioBlob);
        transcribeAndBroadcast(audioFile, meetingLink);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? "destructive" : "default"}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
      {transcript && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Transcript:</h2>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
