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
import VoiceUpload from "@/components/TherapistPanel/VoiceUpload";
import MultiUserSelector from "./MultiUserSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/SubmitButton";
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
  isEditing?: boolean;
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
  isEditing = false,
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
          <input type="hidden" name="avatarId" value={initialData.id} />
        )}

        <div className="space-y-2">
          <Label htmlFor="avatarName">Avatar Name</Label>
          <Input
            id="avatarName"
            name="avatarName"
            required
            defaultValue={initialData?.avatarName || ""}
          />
        </div>
        <Separator />
        <ImageUpload existingImageUrl={initialData?.imageUrl} />
        {!isEditing && ( // TODO: implement voice editing
          <>
            <Separator />
            <VoiceUpload />
          </>
        )}
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
      {state?.message && (
        <Alert
          variant={state.success ? "default" : "destructive"}
          className="my-4"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <SubmitButton>{submitText}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
