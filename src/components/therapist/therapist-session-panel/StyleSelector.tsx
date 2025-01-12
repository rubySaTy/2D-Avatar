import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Check, ChevronDown } from 'lucide-react'
import { toneInstructions } from "@/lib/LLMTones"

const styles: string[] = Object.keys(toneInstructions)

interface StyleSelectorProps {
  onStyleSelect: (style: string, intensity: number) => void
}

export function StyleSelector({ onStyleSelect }: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<string>("")
  const [intensity, setIntensity] = useState<number>(3)

  useEffect(() => {
    if (selectedStyle) {
      onStyleSelect(selectedStyle, intensity)
    } else {
      onStyleSelect("", 3)
    }
  }, [selectedStyle, intensity, onStyleSelect])

  const handleStyleSelect = (style: string) => {
    if (selectedStyle === style) {
      setSelectedStyle("")
    } else {
      setSelectedStyle(style)
    }
  }

  const handleIntensityChange = (value: number[]) => {
    setIntensity(value[0])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-7 px-2 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md flex items-center gap-1"
        >
          {selectedStyle || "Choose style"}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg">
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-1">
            {styles.map((style) => (
              <Button
                key={style}
                variant={selectedStyle === style ? "default" : "ghost"}
                size="sm"
                onClick={() => handleStyleSelect(style)}
                className={`justify-start text-xs h-7 ${
                  selectedStyle === style
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {style}
                {selectedStyle === style && (
                  <Check className="w-3 h-3 ml-auto" />
                )}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Intensity</p>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[intensity]}
              onValueChange={handleIntensityChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
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
  )
}
