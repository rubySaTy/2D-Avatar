"use client";

import { useFormState } from "react-dom";
import { Separator } from "./ui/separator";
import FormCard from "./FormCard";
import { Input } from "./ui/input";
import { SubmitButton } from "./SubmitButton";
import { User } from "@/lib/db/schema";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "./ui/select";
import { createAvatar } from "@/app/actions/createAvatar";
import ImageUpload from "./ImageUpload";
import VoiceUpload from "./VoiceUpload";

interface CreateAvatarProps {
  users: Array<User>;
  currentUser: string;
}

export default function CreateAvatar({
  users,
  currentUser,
}: CreateAvatarProps) {
  const [state, formAction] = useFormState(createAvatar, null);

  return (
    <FormCard title="Create Avatar" message={state?.message}>
      <form action={formAction}>
        <div className="grid w-full items-center gap-3 md:gap-4">
          <Input
            id="avatarName"
            name="avatarName"
            placeholder="Avatar Name"
            required
          />
          <h1>Upload Files</h1>
          <ImageUpload />
          <VoiceUpload />
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="users">User to assign the avatar to:</Label>
            <Select name="userId" required>
              <SelectTrigger id="users">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent position="popper">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {currentUser === user.username ? (
                      <b>{user.username} (You)</b>
                    ) : (
                      user.username
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <SubmitButton>Create avatar</SubmitButton>
        </div>
      </form>
    </FormCard>
  );
}
