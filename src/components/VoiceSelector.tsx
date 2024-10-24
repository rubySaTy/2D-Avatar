// components/VoiceArea.tsx
import { useState, useMemo } from "react";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { MicrosoftVoice } from "@/lib/types";

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
  onChange: (value: string) => void;
  disabled: boolean;
}> = ({ voices, selectedVoice, onChange, disabled }) => (
  <div className="space-y-2">
    <Label htmlFor="voice-select">Voice</Label>
    <Select
      name="voiceId"
      value={selectedVoice}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id="voice-select">
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
  </div>
);

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

  return (
    <>
      <input type="hidden" name="providerType" value="microsoft" />

      {/* Gender Selection */}
      <GenderSelect
        genders={genders}
        selectedGender={gender}
        onChange={(value) => handleChange("gender", value)}
      />

      {/* Language Selection */}
      <LanguageSelect
        languages={languages}
        selectedLanguage={language}
        onChange={(value) => handleChange("language", value)}
        disabled={isLanguageDisabled}
      />

      {/* Voice Selection */}
      <VoiceSelect
        voices={filteredVoices}
        selectedVoice={voice}
        onChange={(value) => handleChange("voice", value)}
        disabled={isVoiceDisabled}
      />

      {/* Style Selection */}
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
