"use client";

import { useActionState, useState } from "react";
import { addClonedVoice } from "@/app/actions/admin";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { SubmitButton } from "@/components/SubmitButton";
import VoiceUpload from "@/components/TherapistPanel/VoiceUpload";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateClonedVoiceForm() {
  const [state, formAction] = useActionState(addClonedVoice, null);
  const [removeBackgroundNoises, setRemoveBackgroundNoises] = useState(false);

  return (
    <form action={formAction}>
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Create new Cloned Voice
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Add a new Cloned voice to the system using ElevenLabs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="voice-name">Voice Name</Label>
          <Input
            id="voice-name"
            name="voice-name"
            placeholder="The name that identifies this voice"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            name="description"
            placeholder="How would you describe the voice?"
          />
        </div>

        <div className="space-y-2">
          <VoiceUpload />
        </div>

        <div className="flex space-x-2">
          <Checkbox
            id="remove-background-noises"
            name="remove-background-noises"
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="remove-background-noises"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remove background noises
            </Label>
            <p className="text-sm text-muted-foreground">
              Tip: If the samples do not include background noise, it can make
              the quality worse.
            </p>
          </div>
        </div>

        {/* <div className="space-y-2">
          <Label>Associated Users</Label>
          <MultiUserSelector
            users={users}
            currentUserId={currentUserId}
            associatedUsers={associatedUsers}
          />
        </div> */}
      </div>

      <ServerActionAlertMessage state={state} />
      <DialogFooter>
        <SubmitButton>Clone Voice</SubmitButton>
      </DialogFooter>
    </form>
  );
}
