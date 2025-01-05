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
import MultiUserSelector from "./MultiUserSelector";
import { createAvatarAdminAction, editAvatarAdminAction } from "@/app/actions/admin";
import type { UserDto, Avatar } from "@/lib/db/schema";

interface CreateAvatarFormProps {
  users: Array<UserDto>;
  currentUserId: string;
}

export function AdminCreateAvatarForm({ users, currentUserId }: CreateAvatarFormProps) {
  return (
    <AdminBaseAvatarForm
      serverAction={createAvatarAdminAction}
      currentUserId={currentUserId}
      users={users}
      title="Create New Avatar"
      description="Add a new avatar to the system."
      submitText="Create Avatar"
    />
  );
}

interface EditAvatarFormProps {
  avatar: Avatar;
  users: Array<UserDto>;
  associatedUsers: Array<UserDto>;
  currentUserId: string;
}

export function AdminEditAvatarForm({
  avatar,
  users,
  associatedUsers,
  currentUserId,
}: EditAvatarFormProps) {
  return (
    <AdminBaseAvatarForm
      serverAction={editAvatarAdminAction}
      currentUserId={currentUserId}
      users={users}
      associatedUsers={associatedUsers}
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
  users: Array<UserDto>;
  associatedUsers?: Array<UserDto>;
  currentUserId: string;
  title: string;
  description: string;
  submitText: "Create Avatar" | "Update Avatar";
}

function AdminBaseAvatarForm({
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
        {initialData && <input type="hidden" name="avatar-id" value={initialData.id} />}

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
