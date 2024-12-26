"use client";

interface User {
  id: string;
  name: string;
}

interface VoiceItemProps {
  id: string;
  name: string;
  previewUrl: string;
  associatedUsers: User[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";

// VoiceItem Component
export default function VoiceItem({
  id,
  name,
  previewUrl,
  associatedUsers,
  onDelete,
  onEdit,
}: VoiceItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(previewUrl));

  const handlePlayPause = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  // Handle audio ending
  audio.onended = () => {
    setIsPlaying(false);
  };

  return (
    <div className="group flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 text-primary" />
        ) : (
          <Play className="h-5 w-5 text-primary ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{name}</span>
        {associatedUsers.length > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-muted-foreground">Used by:</span>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground hover:text-foreground cursor-help truncate">
                  {associatedUsers.length === 1
                    ? associatedUsers[0].name
                    : `${associatedUsers[0].name} and ${
                        associatedUsers.length - 1
                      } others`}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <div className="space-y-1">
                  {associatedUsers.map((user) => (
                    <div key={user.id} className="text-xs">
                      {user.name}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit?.(id)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit voice</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete?.(id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete voice</span>
        </Button>
      </div>
    </div>
  );
}
