"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AvatarWithUsersDto } from "@/lib/db/schema";
import CreateClonedVoiceForm from "./CreateClonedVoiceForm";

interface CreateClonedVoiceDialogProps {
  avatarsWithoutClonedVoice: AvatarWithUsersDto[];
}

export function CreateClonedVoiceDialog({
  avatarsWithoutClonedVoice,
}: CreateClonedVoiceDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Mic className="mr-2 h-4 w-4" /> Create Cloned Voice
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh] p-6">
            <CreateClonedVoiceForm
              avatars={avatarsWithoutClonedVoice}
              onClose={() => setOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
