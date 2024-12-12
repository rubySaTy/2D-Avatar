import { useState, useMemo, useRef } from "react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { MicrosoftVoice } from "@/lib/types";
import { Button } from "../ui/button";
import { Pause, Play } from "lucide-react";

const GenderSelect: React.FC<{
  genders: string[];
  selectedGender: string;
  onChange: (value: string) => void;
}> = ({ genders, selectedGender, onChange }) => (
  <div className="space-y-2">
    <Label htmlFor="gender-select">Gender</Label>
    <Select value={selectedGender} onValueChange={onChange}>
      <SelectTrigger id="gender-select">
        <SelectValue placeholder="Select gender" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Genders</SelectItem>
        {genders.map((gender) => (
          <SelectItem key={gender} value={gender}>
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const LanguageSelect: React.FC<{
  languages: string[];
  selectedLanguage: string;
  onChange: (value: string) => void;
  disabled: boolean;
}> = ({ languages, selectedLanguage, onChange, disabled }) => (
  <div className="space-y-2">
    <Label htmlFor="language-select">Language</Label>
    <Select
      value={selectedLanguage}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id="language-select">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language} value={language}>
            {language}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const VoiceSelect: React.FC<{
  voices: MicrosoftVoice[];
  selectedVoice: string;
  selectedLanguage: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onPreview: (voiceId: string, language: string) => Promise<string>;
}> = ({
  voices,
  selectedVoice,
  selectedLanguage,
  onChange,
  disabled,
  onPreview,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePreview = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        const audioUrl = await onPreview(selectedVoice, selectedLanguage);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="voice-select">Voice</Label>
      <div className="flex items-center space-x-2">
        <Select
          name="voiceId"
          value={selectedVoice}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id="voice-select" className="flex-grow">
            <SelectValue
              placeholder={
                voices.length > 0 ? "Choose a Voice" : "No Voices Available"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id}>
                {voice.name} ({voice.gender})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVoice && (
          <Button
            type="button"
            onClick={handlePreview}
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={disabled}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isPlaying ? "Pause" : "Play"} Voice Preview
            </span>
          </Button>
        )}
      </div>
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      {selectedVoice && (
        <div className="mt-2">
          <p className="text-sm">
            {voices.find((voice) => voice.id === selectedVoice)?.description}
          </p>
        </div>
      )}
    </div>
  );
};

const StyleSelect: React.FC<{
  styles: string[];
  selectedStyle: string;
  onChange: (value: string) => void;
  disabled: boolean;
}> = ({ styles, selectedStyle, onChange, disabled }) => (
  <div className="space-y-2">
    <Label htmlFor="style-select">Style</Label>
    <Select
      name="voiceStyle"
      value={selectedStyle}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id="style-select">
        <SelectValue placeholder="Choose a Style" />
      </SelectTrigger>
      <SelectContent>
        {styles.map((style) => (
          <SelectItem key={style} value={style}>
            {style}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface VoiceSelectorProps {
  voices: MicrosoftVoice[];
  genders: string[];
  languages: string[];
}

export default function VoiceSelector({
  voices,
  genders,
  languages,
}: VoiceSelectorProps) {
  const [selection, setSelection] = useState<{
    gender: string;
    language: string;
    voice: string;
    style: string;
  }>({
    gender: "all",
    language: "",
    voice: "",
    style: "",
  });

  const { gender, language, voice, style } = selection;

  // Memoize filtered voices based on gender and language
  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const matchesGender = gender !== "all" ? v.gender === gender : true;
      const matchesLanguage =
        language !== ""
          ? v.languages.some((lang) => lang.language === language)
          : true;
      return matchesGender && matchesLanguage;
    });
  }, [voices, gender, language]);

  // Determine disabled states
  const isLanguageDisabled = false; // Always enabled since Gender is "all" by default
  const isVoiceDisabled = language === "" || filteredVoices.length === 0;
  const isStyleDisabled =
    voice === "" || !filteredVoices.find((v) => v.id === voice)?.styles.length;

  // Handle selection changes
  const handleChange = (field: keyof typeof selection, value: string) => {
    setSelection((prev) => {
      const updated = { ...prev, [field]: value };

      // Reset dependent fields based on the changed field
      if (field === "gender") {
        updated.language = "";
        updated.voice = "";
        updated.style = "";
      } else if (field === "language") {
        updated.voice = "";
        updated.style = "";
      } else if (field === "voice") {
        updated.style = "";
      }

      return updated;
    });
  };

  // Handle voice preview
  const handlePreview = async (
    voiceId: string,
    selectedLanguage: string
  ): Promise<string> => {
    const voice = voices.find((v) => v.id === voiceId);
    if (voice) {
      const languagePreview = voice.languages.find(
        (lang) => lang.language === selectedLanguage
      );
      if (languagePreview) {
        return languagePreview.preview;
      }
    }
    throw new Error("Preview not available");
  };

  return (
    <>
      <input type="hidden" name="providerType" value="microsoft" />

      <GenderSelect
        genders={genders}
        selectedGender={gender}
        onChange={(value) => handleChange("gender", value)}
      />

      <LanguageSelect
        languages={languages}
        selectedLanguage={language}
        onChange={(value) => handleChange("language", value)}
        disabled={isLanguageDisabled}
      />

      <VoiceSelect
        voices={filteredVoices}
        selectedVoice={voice}
        selectedLanguage={language}
        onChange={(value) => handleChange("voice", value)}
        disabled={isVoiceDisabled}
        onPreview={handlePreview}
      />

      <StyleSelect
        styles={
          voice !== ""
            ? filteredVoices.find((v) => v.id === voice)?.styles || []
            : []
        }
        selectedStyle={style}
        onChange={(value) => handleChange("style", value)}
        disabled={isStyleDisabled}
      />
    </>
  );
}
