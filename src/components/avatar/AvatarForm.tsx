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
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import {
  createAvatarTherapistAction,
  editAvatarTherapistAction,
} from "@/app/actions/avatar";
import type { Avatar } from "@/lib/db/schema";

export function CreateAvatarForm() {
  return (
    <BaseAvatarForm
      serverAction={createAvatarTherapistAction}
      title="Create New Avatar"
      description="Upload a photo to create a new avatar"
      submitText="Create Avatar"
    />
  );
}

interface EditAvatarFormProps {
  avatar: Avatar;
}

export function EditAvatarForm({ avatar }: EditAvatarFormProps) {
  return (
    <BaseAvatarForm
      serverAction={editAvatarTherapistAction}
      initialData={avatar}
      title="Edit Avatar"
      description="Update avatar details."
      submitText="Update Avatar"
    />
  );
}

interface BaseAvatarFormProps {
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
  initialData?: Avatar;
  title: string;
  description: string;
  submitText: "Create Avatar" | "Update Avatar";
}

function BaseAvatarForm({
  serverAction,
  initialData,
  title,
  description,
  submitText,
}: BaseAvatarFormProps) {
  const [state, formAction] = useActionState(serverAction, null);

  return (
    <form action={formAction} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {initialData && (
          <>
            <input type="hidden" name="avatar-id" value={initialData.id} />
            <input type="hidden" name="uploader-id" value={initialData.uploaderId} />
          </>
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
      </div>

      <ServerActionAlertMessage state={state} />
      <DialogFooter>
        <SubmitButton>{submitText}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
