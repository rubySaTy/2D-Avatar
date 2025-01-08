"use client";

import { useState } from "react";
import { Brain, Edit, Image as LucideImage, Pencil, Upload, Wand2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AdminCreateAvatarForm,
  AdminEditAvatarForm,
  CreateAvatarForm,
  EditAvatarForm,
} from "./AvatarForm";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CreateAIAvatarForm } from "./ai/CreateAIAvatarForm";
import type { Avatar, UserDto } from "@/lib/db/schema";

interface AdminCreateAvatarDialogProps {
  users: UserDto[];
  currentUserId: string;
}

export function AdminCreateAvatarDialog({
  users,
  currentUserId,
}: AdminCreateAvatarDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <LucideImage className="mr-2 h-4 w-4" /> Create Avatar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh] p-6">
            <AdminCreateAvatarForm
              users={users}
              currentUserId={currentUserId}
              onClose={() => setOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CreateAvatarDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Upload className="mr-2 h-4 w-4" /> Upload Photo
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea>
          <CreateAvatarForm onClose={() => setOpen(false)} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function CreateAIAvatarDialog({ withImage }: { withImage: boolean }) {
  const [open, setOpen] = useState(false);

  const menuItemContent = withImage ? (
    <>
      <Wand2 className="mr-2 h-4 w-4" />
      Photo + LLM
    </>
  ) : (
    <>
      <Brain className="mr-2 h-4 w-4" />
      LLM Generation
    </>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {menuItemContent}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea>
          <CreateAIAvatarForm withImage={withImage} onClose={() => setOpen(false)} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface AdminEditAvatarDialogProps {
  avatar: Avatar;
  users: UserDto[];
  associatedUsers: UserDto[];
  currentUserId: string;
}

export function AdminEditAvatarDialog({
  avatar,
  users,
  associatedUsers,
  currentUserId,
}: AdminEditAvatarDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <AdminEditAvatarForm
          avatar={avatar}
          users={users}
          associatedUsers={associatedUsers}
          currentUserId={currentUserId}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditAvatarDialogProps {
  selectedAvatar: Avatar;
}

export function EditAvatarDialog({ selectedAvatar }: EditAvatarDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px]">
        <EditAvatarForm avatar={selectedAvatar} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
