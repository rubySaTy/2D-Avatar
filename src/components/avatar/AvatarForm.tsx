"use client";

import { useActionState } from "react";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ImageUploader from "@/components/ImageUploader";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { FormInput } from "@/components/FormInput";
import MultiUserSelector from "./MultiUserSelector";
import { createAvatarAdminAction, editAvatarAdminAction } from "@/app/actions/admin";
import {
  createAvatarTherapistAction,
  editAvatarTherapistAction,
} from "@/app/actions/avatar";
import type { Avatar, UserDto } from "@/lib/db/schema";
import type { ActionResponse, BaseAvatarFormData } from "@/lib/types";

interface BaseAvatarFormProps {
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<ActionResponse<BaseAvatarFormData>>;
  initialData?: Avatar;
  title: string;
  description: string;
  submitText: "Create Avatar" | "Update Avatar";

  /**
   *  Optional Admin-specific fields.
   *  If provided, we'll render the associated user section.
   */
  users?: Array<UserDto>;
  associatedUsers?: Array<UserDto>;
  currentUserId?: string;
}

function BaseAvatarForm({
  serverAction,
  initialData,
  title,
  description,
  submitText,
  users,
  associatedUsers,
  currentUserId,
}: BaseAvatarFormProps) {
  const [state, formAction, isPending] = useActionState(serverAction, null);

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
          <FormInput
            label="Avatar Name"
            id="avatar-name"
            defaultValue={initialData?.avatarName ?? state?.inputs?.avatarName ?? ""}
            error={state?.errors?.avatarName?.[0]}
            required
            minLength={3}
            maxLength={20}
          />
        </div>

        {/* Only Admins can edit images */}
        {initialData && users && associatedUsers && currentUserId && (
          <>
            <Separator />
            <ImageUploader
              title="Drag & drop an image here, or click to select"
              description="Supports: JPEG, JPG, PNG"
              accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
              existingImageUrl={initialData?.imageUrl}
              isFormSubmitted={isPending}
              isValidationError={!!state?.errors?.imageFile?.[0]}
            />
            {state?.errors?.imageFile && (
              <p
                id={`image-file-error`}
                className="text-sm text-destructive [&>svg]:text-destructive"
              >
                {state.errors.imageFile[0]}
              </p>
            )}
          </>
        )}

        {/* 
          If users/associatedUsers/currentUserId are passed in, 
          this indicates it's an Admin usage, so show the MultiUserSelector 
        */}
        {users && associatedUsers && currentUserId && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label>Associated Users</Label>
              <MultiUserSelector
                users={users}
                currentUserId={currentUserId}
                associatedUsers={associatedUsers}
              />
            </div>
          </>
        )}
      </div>

      <ServerActionAlertMessage state={state} />
      <DialogFooter>
        <SubmitButton>{submitText}</SubmitButton>
      </DialogFooter>
    </form>
  );
}

interface AdminCreateAvatarFormProps {
  users: Array<UserDto>;
  currentUserId: string;
}

export function AdminCreateAvatarForm({
  users,
  currentUserId,
}: AdminCreateAvatarFormProps) {
  return (
    <BaseAvatarForm
      serverAction={createAvatarAdminAction}
      title="Create New Avatar"
      description="Add a new avatar to the system."
      submitText="Create Avatar"
      users={users}
      currentUserId={currentUserId}
      associatedUsers={[]}
    />
  );
}

interface AdminEditAvatarFormProps {
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
}: AdminEditAvatarFormProps) {
  return (
    <BaseAvatarForm
      serverAction={editAvatarAdminAction}
      initialData={avatar}
      title="Edit Avatar"
      description="Update avatar details."
      submitText="Update Avatar"
      users={users}
      associatedUsers={associatedUsers}
      currentUserId={currentUserId}
    />
  );
}

export function CreateAvatarForm() {
  return (
    <BaseAvatarForm
      serverAction={createAvatarTherapistAction}
      title="Create New Avatar"
      description="Upload a photo to create a new avatar."
      submitText="Create Avatar"
    />
  );
}

export function EditAvatarForm({ avatar }: { avatar: Avatar }) {
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
