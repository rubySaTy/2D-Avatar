"use client";

import { useActionState, useEffect } from "react";
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
import { createAvatarAction, editAvatarAction } from "@/app/actions/avatar";
import { useToast } from "@/hooks/use-toast";
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
  onClose: () => void;

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
  onClose,
}: BaseAvatarFormProps) {
  const [state, formAction, isPending] = useActionState(serverAction, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      onClose();
      toast({
        title: "Success",
        description: <span className="whitespace-pre-line">{state.message}</span>,
        variant: "default",
        duration: 5000,
      });
    }
  }, [state, onClose]);

  return (
    <form action={formAction} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
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

        {!initialData && (
          <>
            <Separator />
            <ImageUploader
              title="Drag & drop an image here, or click to select"
              description="Supports: JPEG, JPG, PNG"
              accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
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
  onClose: () => void;
}

export function AdminCreateAvatarForm({
  users,
  currentUserId,
  onClose,
}: AdminCreateAvatarFormProps) {
  return (
    <BaseAvatarForm
      serverAction={createAvatarAction}
      title="Create New Avatar"
      description="Add a new avatar to the system."
      submitText="Create Avatar"
      users={users}
      currentUserId={currentUserId}
      associatedUsers={[]}
      onClose={onClose}
    />
  );
}

interface AdminEditAvatarFormProps {
  avatar: Avatar;
  users: Array<UserDto>;
  associatedUsers: Array<UserDto>;
  currentUserId: string;
  onClose: () => void;
}

export function AdminEditAvatarForm({
  avatar,
  users,
  associatedUsers,
  currentUserId,
  onClose,
}: AdminEditAvatarFormProps) {
  return (
    <BaseAvatarForm
      serverAction={editAvatarAction}
      initialData={avatar}
      title="Edit Avatar"
      description="Update avatar details."
      submitText="Update Avatar"
      users={users}
      associatedUsers={associatedUsers}
      currentUserId={currentUserId}
      onClose={onClose}
    />
  );
}

export function CreateAvatarForm({ onClose }: { onClose: () => void }) {
  return (
    <BaseAvatarForm
      serverAction={createAvatarAction}
      title="Create New Avatar"
      description="Upload a photo to create a new avatar."
      submitText="Create Avatar"
      onClose={onClose}
    />
  );
}

interface EditAvatarFormProps {
  avatar: Avatar;
  onClose: () => void;
}

export function EditAvatarForm({ avatar, onClose }: EditAvatarFormProps) {
  return (
    <BaseAvatarForm
      serverAction={editAvatarAction}
      initialData={avatar}
      title="Edit Avatar"
      description="Update avatar details."
      submitText="Update Avatar"
      onClose={onClose}
    />
  );
}
