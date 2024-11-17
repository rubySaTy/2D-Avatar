"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ImageUpload from "../ImageUpload";
import VoiceUpload from "../VoiceUpload";
import MultiUserSelector from "./MultiUserSelector";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { createAvatar } from "@/app/actions/admin";
import { Separator } from "../ui/separator";
import { SubmitButton } from "../SubmitButton";
import { type UserDto } from "@/lib/db/schema";

interface CreateAvatarFormProps {
  users: Array<UserDto>;
}

export default function CreateAvatarForm({ users }: CreateAvatarFormProps) {
  const [state, formAction] = useFormState(createAvatar, null);

  return (
    <form action={formAction} className="space-y-6">
      <DialogHeader>
        <DialogTitle>Create New Avatar</DialogTitle>
        <DialogDescription>Add a new avatar to the system.</DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="avatarName">Name</Label>
          <Input
            id="avatarName"
            name="avatarName"
            required
            placeholder="Enter avatar name"
          />
        </div>
        <Separator />
        <ImageUpload />
        <Separator />
        <VoiceUpload />
        <Separator />
        <div className="space-y-2">
          <Label>Associated Users</Label>
          <MultiUserSelector users={users} />
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
        <SubmitButton>Create Avatar</SubmitButton>
      </DialogFooter>
    </form>
  );
}
