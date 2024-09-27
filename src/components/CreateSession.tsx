"use client";

import { useState } from "react";
import type { Avatar } from "@/lib/db/schema";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import Image from "next/image";
import { useFormState } from "react-dom";
import { createSession } from "@/app/actions";
import { SubmitButton } from "./SubmitButton";

interface CreateSessionProps {
  avatars: Array<Avatar>;
}

export default function CreateSession({ avatars }: CreateSessionProps) {
  const [avatarImgUrl, setAvatarImgUrl] = useState("");
  const [state, formAction] = useFormState(createSession, null);

  return (
    <form action={formAction}>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="avatars">Avatars</Label>
          <Select
            name="avatar"
            onValueChange={(avatar) => {
              const parsedAvatar = JSON.parse(avatar);
              setAvatarImgUrl(parsedAvatar.imageUrl);
            }}
          >
            <SelectTrigger id="avatars">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent position="popper">
              {avatars.map((avatar) => (
                <SelectItem key={avatar.id} value={JSON.stringify(avatar)}>
                  {avatar.avatarName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {avatarImgUrl && (
          <Image src={avatarImgUrl} alt="Avatar" width={100} height={100} />
        )}
      </div>
      <SubmitButton>Create a Session</SubmitButton>
      {state?.message && <p>{state.message}</p>}
    </form>
  );
}
