"use client";

import { useActionState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/SubmitButton";
import { generateLLMAvatar } from "@/app/actions/avatar";
import ServerActionAlertMessage from "../ServerActionAlertMessage";
import type { Image } from "openai/resources/images.mjs";

interface GenerateImageFormProps {
  onGenerate: (images: Image[]) => void;
}

export function GenerateImageForm({ onGenerate }: GenerateImageFormProps) {
  const [state, formAction] = useActionState(generateLLMAvatar, null);

  useEffect(() => {
    if (state && state.data) {
      onGenerate(state.data);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt">Description Prompt</Label>
        <Textarea
          id="prompt"
          name="prompt"
          placeholder="Describe the avatar you want to generate"
          required
          defaultValue={(state?.payload?.get("prompt") || "") as string}
        />
      </div>

      <ServerActionAlertMessage state={state} />
      <SubmitButton>Generate</SubmitButton>
    </form>
  );
}
