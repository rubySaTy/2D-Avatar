"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload";
import MultiUserSelector from "./MultiUserSelector";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import type { UserDto, Avatar } from "@/lib/db/schema";

interface BaseAvatarFormProps {
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
  initialData?: Avatar;
  users: Array<UserDto>;
  associatedUsers?: Array<UserDto>;
  currentUserId: string;
  title: string;
  description: string;
  submitText: "Create Avatar" | "Update Avatar";
}

export default function BaseAvatarForm({
  serverAction,
  initialData,
  users,
  associatedUsers = [],
  currentUserId,
  title,
  description,
  submitText,
}: BaseAvatarFormProps) {
  const [state, formAction] = useActionState(serverAction, null);

  return (
    <form action={formAction} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold tracking-tight">
          {title}
        </DialogTitle>
        <DialogDescription className="text-base text-muted-foreground">
          {description}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {initialData && (
          <input type="hidden" name="avatar-id" value={initialData.id} />
        )}

        <div className="space-y-2">
          <Label htmlFor="avatar-name">Avatar Name</Label>
          <Input
            id="avatar-name"
            name="avatar-name"
            required
            defaultValue={initialData?.avatarName || ""}
          />
        </div>
        <Separator />
        <ImageUpload existingImageUrl={initialData?.imageUrl} />
        <Separator />
        <div className="space-y-2">
          <Label>Associated Users</Label>
          <MultiUserSelector
            users={users}
            currentUserId={currentUserId}
            associatedUsers={associatedUsers}
          />
        </div>
      </div>

      <ServerActionAlertMessage state={state} />
      <DialogFooter>
        <SubmitButton>{submitText}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
