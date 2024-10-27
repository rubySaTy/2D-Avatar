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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import Spinner from "./ui/spinner";

interface CreateSessionProps {
  avatars: Array<Avatar>;
}

export default function CreateSession({ avatars }: CreateSessionProps) {
  const [avatarImgUrl, setAvatarImgUrl] = useState("");
  const [state, formAction] = useFormState(createSession, null);

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Create a Session</CardTitle>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="avatars">Select an Avatar</Label>
              <Select
                name="avatar"
                onValueChange={(value) => {
                  const avatar = JSON.parse(value) as Avatar;
                  setAvatarImgUrl(avatar.imageUrl);
                }}
              >
                <SelectTrigger id="avatars">
                  <SelectValue placeholder="Choose your avatar" />
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
            <div className="relative h-[170px]">
              {!avatarImgUrl && <Spinner />}
              {avatarImgUrl && (
                <div className="flex justify-center">
                  <Image
                    src={avatarImgUrl}
                    alt="Selected Avatar"
                    width={100}
                    height={100}
                    style={{ width: "auto", height: "auto" }}
                    className="rounded-full"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <SubmitButton type="submit" className="w-full">
            Create Session
          </SubmitButton>
          {state?.message && (
            <p className="text-sm text-muted-foreground">{state.message}</p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
