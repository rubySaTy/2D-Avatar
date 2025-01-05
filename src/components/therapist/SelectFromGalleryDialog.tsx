"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Avatar } from "@/lib/db/schema";

interface SelectFromGalleryProps {
  publicAvatars: Avatar[];
  onAvatarSelected: (avatar: Avatar) => void;
};

export function SelectFromGallery({
  publicAvatars,
  onAvatarSelected,
}: SelectFromGalleryProps) {
  const [selectedGalleryAvatar, setSelectedGalleryAvatar] = useState<Avatar | null>(null);

  const handleSelect = () => {
    if (selectedGalleryAvatar) onAvatarSelected(selectedGalleryAvatar);
  };

return (
    <>
      <DialogHeader>
        <DialogTitle>Select Avatar from Gallery</DialogTitle>
        <DialogDescription>Choose a pre-made avatar from our gallery</DialogDescription>
      </DialogHeader>
      <ScrollArea className="h-[300px] pr-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
          {publicAvatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${
                selectedGalleryAvatar?.id === avatar.id
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "hover:bg-accent"
              }`}
              onClick={() => setSelectedGalleryAvatar(avatar)}
            >
              <Image
                src={avatar.imageUrl}
                alt={`${avatar.avatarName} avatar`}
                width={80}
                height={80}
                style={{ width: "auto", height: "auto" }}
                className="rounded-full"
              />
              <span className="text-sm text-center mt-2">{avatar.avatarName}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button onClick={handleSelect} disabled={!selectedGalleryAvatar} className="w-full sm:w-auto">
          Select Avatar
        </Button>
      </DialogFooter>
    </>
  )
}
