"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/SubmitButton";
import PasswordInputWithToggle from "@/components/PasswordInputWithToggle";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { createUserAction, editUserAction } from "@/app/actions/admin";
import { useToast } from "@/hooks/use-toast";
import type { UserDto } from "@/lib/db/schema";
import type { ActionResponse, BaseUserFormData } from "@/lib/types";

export function EditUserForm({ user, onClose }: { user: UserDto; onClose: () => void }) {
  return (
    <BaseUserForm
      serverAction={editUserAction}
      initialData={user}
      title="Edit User"
      description="Update user details."
      submitText="Update User"
      isEditing={true}
      onClose={onClose}
    />
  );
}

export function CreateUserForm({ onClose }: { onClose: () => void }) {
  return (
    <BaseUserForm
      serverAction={createUserAction}
      title="Create New User"
      description="Add a new user to the system."
      submitText="Create User"
      onClose={onClose}
    />
  );
}

interface BaseUserFormProps {
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<ActionResponse<BaseUserFormData>>;
  initialData?: Partial<UserDto>;
  title: string;
  description: string;
  submitText: "Create User" | "Update User";
  isEditing?: boolean;
  onClose: () => void;
}

function BaseUserForm({
  serverAction,
  initialData = {},
  title,
  description,
  submitText,
  isEditing = false,
  onClose,
}: BaseUserFormProps) {
  const [state, formAction] = useActionState(serverAction, null);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      onClose();
      toast({
        title: "Success",
        description: state.message,
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
        {isEditing && <input type="hidden" name="user-id" value={initialData.id} />}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username
          </Label>
          <div className="col-span-3">
            <Input
              id="username"
              name="username"
              defaultValue={initialData.username ?? state?.inputs?.username ?? ""}
              className={
                state?.errors?.username?.[0]
                  ? "border-destructive/50 dark:border-destructive"
                  : ""
              }
              required
              minLength={3}
              maxLength={30}
            />
            {state?.errors?.username && (
              <p
                id={`username-error`}
                className="text-sm text-destructive [&>svg]:text-destructive"
              >
                {state.errors.username[0]}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <div className="col-span-3">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData.email ?? state?.inputs?.email ?? ""}
              className={
                state?.errors?.email?.[0]
                  ? "border-destructive/50 dark:border-destructive"
                  : ""
              }
              required
            />
            {state?.errors?.email && (
              <p
                id={`email-error`}
                className="text-sm text-destructive [&>svg]:text-destructive"
              >
                {state.errors.email[0]}
              </p>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <div className="col-span-3">
              <PasswordInputWithToggle
                data={state?.inputs?.password}
                error={!!state?.errors?.password}
              />
              {state?.errors?.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive [&>svg]:text-destructive"
                >
                  {state.errors.password[0]}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            User Role
          </Label>
          <div className="col-span-3">
            <Select
              name="role"
              defaultValue={initialData.role ?? state?.inputs?.role ?? "therapist"}
              required
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="therapist">Therapist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.role && (
              <p
                id="role-error"
                className="text-sm text-destructive [&>svg]:text-destructive"
              >
                {state.errors.role[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      <ServerActionAlertMessage state={state} />
      <DialogFooter>
        <SubmitButton type="submit">{submitText}</SubmitButton>
      </DialogFooter>
    </form>
  );
}
