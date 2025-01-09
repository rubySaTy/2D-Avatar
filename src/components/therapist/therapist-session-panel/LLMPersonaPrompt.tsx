import { transcribe } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";

const EXAMPLE_PERSONA_PROMPT =
  "A 30-year-old wife named Sarah in marriage counseling, who feels hurt due to her husband’s emotional distance. She’s empathetic but needs to express her feelings more assertively so that he understands how neglected she feels. She genuinely loves him but is frustrated by his lack of engagement.";

interface PersonaPromptProps {
  therapistPersona: string;
  setTherapistPersona: (value: string) => void;
}

export function LLMPersonaPrompt({
  therapistPersona,
  setTherapistPersona,
}: PersonaPromptProps) {
  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onRecordingComplete: async (audioFile: File) => {
      const transcribed = await transcribe(audioFile);
      setTherapistPersona(transcribed || "There was an error transcribing.");
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
    <div className="space-y-2 mb-6">
      <Label htmlFor="persona-prompt" className="text-lg font-semibold">
        Persona Prompt
      </Label>
      <div className="relative">
        <Textarea
          id="persona-prompt"
          value={therapistPersona}
          onChange={(e) => setTherapistPersona(e.target.value)}
          placeholder={`Example: ${EXAMPLE_PERSONA_PROMPT}`}
          className={`min-h-[100px] text-base resize-none ${
            isRecording ? "border-red-500 border-2" : ""
          }`}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="animate-pulse bg-red-500 rounded-full h-2 w-2" />
              <span className="text-sm text-red-500">Recording...</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-muted ${
              isRecording ? " text-red-500 " : ""
            }`}
            type="button"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            onClick={handleRecordingToggle}
          >
            {isRecording ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
