"use client";

import { useActionState } from "react";
import { uploadClonedVoice } from "@/app/actions/admin";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { SubmitButton } from "@/components/SubmitButton";
import VoiceUpload from "@/components/therapist/therapist-session-panel/VoiceUpload";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MultiAvatarSelector from "./MultiAvatarSelector";
import type { Avatar } from "@/lib/db/schema";

interface CreateClonedVoiceFormProps {
  avatars: Array<Avatar>;
}

export default function CreateClonedVoiceForm({ avatars }: CreateClonedVoiceFormProps) {
  const [state, formAction] = useActionState(uploadClonedVoice, null);

  return (
    <form action={formAction} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold tracking-tight">
          Create new Cloned Voice
        </DialogTitle>
        <DialogDescription className="text-base text-muted-foreground">
          Attach a Cloned voice to avatars using ElevenLabs
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="voice-name">Voice Name</Label>
          <Input id="voice-name" name="voice-name" required />
        </div>

        <div className="space-y-2">
          <VoiceUpload />
        </div>

        <div className="flex space-x-2">
          <Checkbox id="remove-background-noise" name="remove-background-noise" />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="remove-background-noise"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remove background noises
            </Label>
            <p className="text-sm text-muted-foreground">
              Tip: If the samples do not include background noise, it can make the quality
              worse.
            </p>
          </div>
        </div>

        {/* <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder='How would you describe the voice? e.g. "An old American male voice with a slight hoarseness in his throat. Perfect for news."'
          />
        </div> */}

        <div className="space-y-2">
          <Label>Associated Avatars</Label>
          <MultiAvatarSelector avatars={avatars} />
        </div>
      </div>

      <ServerActionAlertMessage state={state} />
      <DialogFooter>
        <SubmitButton>Clone Voice</SubmitButton>
      </DialogFooter>
    </form>
  );
}
