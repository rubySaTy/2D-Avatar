"use client";

import { useActionState } from "react";
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
import type { UserDto } from "@/lib/db/schema";
import { createUserAction, editUserAction } from "@/app/actions/admin";
import PasswordInputWithToggle from "@/components/PasswordInputWithToggle";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";

export function EditUserForm({ user }: { user: UserDto }) {
  return (
    <BaseUserForm
      serverAction={editUserAction}
      initialData={user}
      title="Edit User"
      description="Update user details."
      submitText="Update User"
      isEditing={true}
    />
  );
}

export function CreateUserForm() {
  return (
    <BaseUserForm
      serverAction={createUserAction}
      title="Create New User"
      description="Add a new user to the system."
      submitText="Create User"
    />
  );
}

interface BaseUserFormProps {
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
  initialData?: Partial<UserDto>;
  title: string;
  description: string;
  submitText: "Create User" | "Update User";
  isEditing?: boolean;
}

function BaseUserForm({
  serverAction,
  initialData = {},
  title,
  description,
  submitText,
  isEditing = false,
}: BaseUserFormProps) {
  const [state, formAction] = useActionState(serverAction, null);

  // TODO: "Add zod validation on client side too";
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
              defaultValue={initialData.username || ""}
              required
            />
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
              defaultValue={initialData.email || ""}
              required
            />
          </div>
        </div>

        {!isEditing && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <div className="col-span-3">
              <PasswordInputWithToggle />
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            User Role
          </Label>
          <div className="col-span-3">
            <Select name="role" defaultValue={initialData.role || "therapist"} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="therapist">Therapist</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
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
