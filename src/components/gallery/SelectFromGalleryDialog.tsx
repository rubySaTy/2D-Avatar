"use client";

import { useState } from "react";
import { SelectFromGallery } from "./SelectFromGallery";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Avatar } from "@/lib/db/schema";

interface SelectFromGalleryDialogProps {
  publicAvatars: Avatar[];
  setSelectedAvatar: (avatar: Avatar) => void;
}

export function SelectFromGalleryDialog({
  publicAvatars,
  setSelectedAvatar,
}: SelectFromGalleryDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          Select from Gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh] p-4 sm:p-6">
          <SelectFromGallery
            publicAvatars={publicAvatars}
            onAvatarSelected={setSelectedAvatar}
            onClose={() => setOpen(false)}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
