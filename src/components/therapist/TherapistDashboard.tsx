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
import { Upload, Brain, Wand2, Edit, X } from "lucide-react";
import { SelectFromGallery } from "./SelectFromGalleryDialog";
import { createSession } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { CreateAvatarForm, EditAvatarForm } from "@/components/avatar/AvatarForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    <div>
      <h1 className="text-3xl font-bold mb-6">Avatar Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Upload Photo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] p-0">
            <ScrollArea className="max-h-[90vh] p-6">
              <CreateAvatarForm />
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Button>
          <Wand2 className="mr-2 h-4 w-4" /> Photo + LLM
        </Button>
      </div>

      <div className="flex gap-6">
        <Card className="flex-grow">
          <CardHeader>
            <CardTitle>Available Avatars</CardTitle>
            <CardDescription>Select an avatar to create a session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search avatars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
              />

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Select from Gallery</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] p-0">
                  <ScrollArea className="max-h-[90vh] p-6">
                    <SelectFromGallery
                      publicAvatars={publicAvatars}
                      onAvatarSelected={setSelectedAvatar}
                    />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
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
                    <span className="text-sm text-center">{avatar.avatarName}</span>
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
  const [state, action] = useActionState(createSession, null);

  return (
    <Card className="w-64">
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

            <h3 className="text-lg font-semibold mb-2">{selectedAvatar.avatarName}</h3>
            <div className="flex gap-2 mb-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <EditAvatarForm avatar={selectedAvatar} />
                </DialogContent>
              </Dialog>

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
