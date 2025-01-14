"use client";

import { useState, useMemo, useActionState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { createSessionAction } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { AvatarCreationDropdown } from "@/components/avatar/AvatarCreationDropdown";
import { EditAvatarDialog } from "@/components/avatar/AvatarDialog";
import { SelectFromGalleryDialog } from "@/components/gallery/SelectFromGalleryDialog";
import type { Avatar } from "@/lib/db/schema";

interface AvatarDashboardProps {
  avatars: Avatar[];
  publicAvatars: Avatar[];
}

export function AvatarDashboard({ avatars, publicAvatars }: AvatarDashboardProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAvatars = useMemo(() => {
    return avatars.filter((avatar) =>
      avatar.avatarName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Avatar Dashboard</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className="text-xl font-semibold">Available Avatars</h2>
        <AvatarCreationDropdown />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-grow">
          <CardHeader>
            <CardDescription>Select an avatar to create a session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <Input
                placeholder="Search avatars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
              />

              <SelectFromGalleryDialog
                publicAvatars={publicAvatars}
                setSelectedAvatar={setSelectedAvatar}
              />
            </div>
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-1">
                {filteredAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAvatar?.id === avatar.id
                        ? "bg-primary/10 ring-2 ring-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <Image
                      src={avatar.imageUrl}
                      alt={`${avatar.avatarName}'s avatar`}
                      width={80}
                      height={80}
                      style={{ width: "auto", height: "auto" }}
                      className="rounded-full"
                      priority
                    />
                    <span className="text-sm text-center mt-2">{avatar.avatarName}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedAvatar && (
          <CreateSessionForm
            selectedAvatar={selectedAvatar}
            setSelectedAvatar={setSelectedAvatar}
          />
        )}
      </div>
    </div>
  );
}

interface CreateSessionFormProps {
  selectedAvatar: Avatar;
  setSelectedAvatar: (avatar: Avatar | null) => void;
}

function CreateSessionForm({
  selectedAvatar,
  setSelectedAvatar,
}: CreateSessionFormProps) {
  const [state, action] = useActionState(createSessionAction, null);

  return (
    <Card className="w-full lg:w-64">
      <CardHeader>
        <CardTitle>Selected Avatar</CardTitle>
      </CardHeader>
      <form action={action}>
        <input type="hidden" name="avatar-id" value={selectedAvatar.id} />

        <CardContent>
          <div className="flex flex-col items-center">
            <Image
              src={selectedAvatar.imageUrl}
              alt="Selected Avatar"
              width={100}
              height={100}
              style={{ width: "auto", height: "auto" }}
              className="rounded-full"
            />

            <h3 className="text-lg font-semibold mt-4 mb-2">
              {selectedAvatar.avatarName}
            </h3>
            <div className="flex gap-2 mb-4">
              <EditAvatarDialog selectedAvatar={selectedAvatar} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAvatar(null)}
              >
                <X className="mr-2 h-4 w-4" /> Deselect
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-4">
          <SubmitButton className="w-full">Create Session</SubmitButton>
          {state && <ServerActionAlertMessage state={state} />}
        </CardFooter>
      </form>
    </Card>
  );
}
