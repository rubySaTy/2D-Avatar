// VoiceSelector.tsx
"use client";

import type { Voice } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoiceSelectorProps {
  voices: Voice[];
  genders: string[];
  languages: string[];
  selectedGender: string | null;
  selectedLanguage: string | null;
  selectedVoice: Voice | null;
  selectedStyle: string | null;
  onGenderChange: (gender: string | null) => void;
  onLanguageChange: (language: string | null) => void;
  onVoiceChange: (voice: Voice | null) => void;
  onStyleChange: (style: string | null) => void;
}

export default function VoiceSelector({
  voices,
  genders,
  languages,
  selectedGender,
  selectedLanguage,
  selectedVoice,
  selectedStyle,
  onGenderChange,
  onLanguageChange,
  onVoiceChange,
  onStyleChange,
}: VoiceSelectorProps) {
  // Filter voices based on selected gender and language
  const filteredVoices = voices.filter((voice) => {
    const matchesGender =
      selectedGender && selectedGender !== "all"
        ? voice.gender === selectedGender
        : true;
    const matchesLanguage =
      selectedLanguage && selectedLanguage !== "all"
        ? voice.languages.some((lang) => lang.language === selectedLanguage)
        : true;
    return matchesGender && matchesLanguage;
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Voice Selector</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gender Selection */}
          <div className="space-y-2">
            <Label htmlFor="gender-select">Gender</Label>
            <Select
              value={selectedGender || undefined}
              onValueChange={(value: string | null) => {
                onGenderChange(value === "all" ? null : value);
                onVoiceChange(null);
                onStyleChange(null);
              }}
            >
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

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language-select">Language</Label>
            <Select
              value={selectedLanguage || undefined}
              onValueChange={(value: string | null) => {
                onLanguageChange(value === "all" ? null : value);
                onVoiceChange(null);
                onStyleChange(null);
              }}
            >
              <SelectTrigger id="language-select">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice-select">Voice</Label>
          <Select
            value={selectedVoice?.id || undefined}
            onValueChange={(value) => {
              const voice = filteredVoices.find((v) => v.id === value);
              onVoiceChange(voice || null);
              onStyleChange(null);
            }}
            disabled={filteredVoices.length === 0}
          >
            <SelectTrigger id="voice-select">
              <SelectValue
                placeholder={
                  filteredVoices.length > 0
                    ? "Choose a Voice"
                    : "No Voices Available"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredVoices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name} ({voice.gender})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Style Selection */}
        {selectedVoice && selectedVoice.styles.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="style-select">Style</Label>
            <Select
              value={selectedStyle || undefined}
              onValueChange={(value) => onStyleChange(value)}
            >
              <SelectTrigger id="style-select">
                <SelectValue placeholder="Choose a Style" />
              </SelectTrigger>
              <SelectContent>
                {selectedVoice.styles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
