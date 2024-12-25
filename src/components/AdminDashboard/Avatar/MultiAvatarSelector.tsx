"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Avatar } from "@/lib/db/schema";

interface MultiAvatarSelectorProps {
  avatars: Array<Avatar>;
}

export default function MultiAvatarSelector({
  avatars,
}: MultiAvatarSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedAvatars, setSelectedAvatars] = useState<Array<Avatar>>([]);

  const toggleAvatar = (avatar: Avatar) => {
    setSelectedAvatars((current) =>
      current.some((selectedAvatar) => selectedAvatar.id === avatar.id)
        ? current.filter((selectedAvatar) => selectedAvatar.id !== avatar.id)
        : [...current, avatar]
    );
  };

  const removeAvatar = (avatarId: number) => {
    setSelectedAvatars((current) =>
      current.filter((selectedAvatar) => selectedAvatar.id !== avatarId)
    );
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select avatars
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search avatars..." />
            <CommandList>
              <CommandEmpty>No avatar found.</CommandEmpty>
              <CommandGroup>
                {avatars.map((avatar) => (
                  <CommandItem
                    key={avatar.id}
                    onSelect={() => toggleAvatar(avatar)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAvatars.some(
                          (selectedAvatar) => selectedAvatar.id === avatar.id
                        )
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {avatar.avatarName}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {selectedAvatars.map((avatar) => (
          <Badge key={avatar.id} variant="secondary">
            {avatar.avatarName}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-4 w-4 p-0"
              onClick={() => removeAvatar(avatar.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {selectedAvatars.map((avatar) => (
        <input
          key={avatar.id}
          type="hidden"
          name="associated-avatars-ids"
          value={avatar.id}
        />
      ))}
    </div>
  );
}
