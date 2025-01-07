import { useState, useRef, useCallback, useEffect } from "react";

type UseAudioRecorderConfig = {
  onRecordingComplete?: (audioFile: File) => Promise<void>;
};

/**
 * This hook encapsulates audio recording logic,
 * returning the current state, a timer, and control methods.
 */
export function useAudioRecorder({ onRecordingComplete }: UseAudioRecorderConfig) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // in seconds
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder is not supported in this browser.");
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Collect data as it becomes available
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle the stop event
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        // Stop tracks after recording
        stream.getTracks().forEach((track) => track.stop());

        // Convert blob to file
        const audioFile = new File([audioBlob], "recording.wav", { type: "audio/wav" });

        // Invoke callback if provided
        if (onRecordingComplete) {
          try {
            await onRecordingComplete(audioFile);
          } catch (error) {
            console.error("Error in onRecordingComplete:", error);
          }
        }
      };

      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0); // reset timer to 0

      // Start a timer to display recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.warn("Error accessing microphone:", error);
      alert("Could not start recording. Please check your microphone permissions.");
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  /**
   * Cleanup on unmount:
   * If the component using this hook unmounts mid-recording,
   * we ensure we stop the recorder and clear the timer.
   */
  useEffect(() => {
    return () => {
      // stop recording if in progress
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      // clear timer if running
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { isRecording, recordingTime, startRecording, stopRecording };
}
