import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Check } from "lucide-react";
import { toneInstructions } from "@/lib/LLMTones";

const styles: string[] = Object.keys(toneInstructions);

interface StyleSelectorProps {
  onStyleSelect: (style: string, intensity: number) => void;
}

export function StyleSelector({ onStyleSelect }: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(3);

  useEffect(() => {
    if (selectedStyle) {
      onStyleSelect(selectedStyle, intensity);
    } else {
      onStyleSelect("", 3);
    }
  }, [selectedStyle, intensity, onStyleSelect]);

  const handleStyleSelect = (style: string) => {
    if (selectedStyle === style) {
      setSelectedStyle("");
    } else {
      setSelectedStyle(style);
    }
  };

  const handleIntensityChange = (value: number[]) => {
    setIntensity(value[0]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="absolute w-28 bottom-2 right-2 bg-white dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {selectedStyle || "Choose Style"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {styles.map((style) => (
              <Button
                key={style}
                variant={selectedStyle === style ? "default" : "outline"}
                size="sm"
                onClick={() => handleStyleSelect(style)}
                className={`justify-start transition-all ${
                  selectedStyle === style
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {style}
                {selectedStyle === style && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Intensity</p>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[intensity]}
              onValueChange={handleIntensityChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
