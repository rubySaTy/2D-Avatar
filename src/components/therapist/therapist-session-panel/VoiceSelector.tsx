import { useState, useRef } from "react";
import { Check, ChevronDown, Play, Pause } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { MicrosoftVoice } from "@/lib/types";

interface VoiceSelectorProps {
  voices: MicrosoftVoice[];
  genders: string[];
  languages: string[];
  ageGroups: string[];
  onVoiceSelect: (voice: MicrosoftVoice) => void;
}

export default function VoiceSelector({
  voices,
  genders,
  languages,
  ageGroups,
  onVoiceSelect,
}: VoiceSelectorProps) {
  const [selectedVoice, setSelectedVoice] = useState<MicrosoftVoice | null>(null);
  const [filters, setFilters] = useState({
    gender: "",
    language: "",
    ageGroup: "",
  });
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredVoices = voices.filter((voice) => {
    const matchesGender = !filters.gender || voice.gender === filters.gender;
    const matchesLanguage =
      !filters.language ||
      voice.languages.some((lang) => lang.language === filters.language);
    const matchesAge = !filters.ageGroup || voice.ageGroup === filters.ageGroup;

    return matchesGender && matchesLanguage && matchesAge;
  });

  const handleVoiceSelect = (voice: MicrosoftVoice) => {
    setSelectedVoice(voice);
    onVoiceSelect(voice);
  };

  const handlePreview = (voice: MicrosoftVoice) => {
    const selectedLanguage = filters.language;
    const languageData = voice.languages.find(
      (lang) => lang.language === selectedLanguage
    );
    const previewUrl = languageData?.preview ?? voice.languages[0]?.preview;
    if (!previewUrl) return;

    if (playingVoiceId === voice.id) {
      // Stop the current playback
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
    } else {
      // Stop any existing playback before starting a new one
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create a new audio element and play
      const audio = new Audio(previewUrl);
      audioRef.current = audio;
      audio.play();
      setPlayingVoiceId(voice.id);

      // Reset state when playback ends
      audio.onended = () => {
        setPlayingVoiceId(null);
        audioRef.current = null;
      };
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center gap-1"
        >
          {selectedVoice?.name || "Select voice"}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
        <Command>
          <CommandInput placeholder="Search voices..." className="h-9 text-xs" />
          <CommandList>
            <div className="p-2 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-1">
              <select
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, language: e.target.value }))
                }
                value={filters.language}
              >
                <option value="">Language</option>
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>

              <select
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, gender: e.target.value }))
                }
                value={filters.gender}
              >
                <option value="">Gender</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>

              <select
                className="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-700"
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, ageGroup: e.target.value }))
                }
                value={filters.ageGroup}
              >
                <option value="">Age</option>
                {ageGroups.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <CommandEmpty>No voice found.</CommandEmpty>
            <CommandGroup>
              {filteredVoices.map((voice) => (
                <CommandItem
                  key={voice.id}
                  onSelect={() => handleVoiceSelect(voice)}
                  className="flex items-center justify-between p-2 text-sm"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{voice.name}</div>
                    <div className="text-xs text-gray-500">
                      {voice.gender} • {voice.languages[0]?.language}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(voice);
                      }}
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    {selectedVoice?.id === voice.id && <Check className="h-3 w-3" />}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
