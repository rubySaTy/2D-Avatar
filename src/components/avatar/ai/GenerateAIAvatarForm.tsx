"use client";

import { useActionState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { Separator } from "@/components/ui/separator";
import ImageUploader from "@/components/ImageUploader";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";
import type { GenerateAIAvatarActionResponse } from "@/lib/types";

interface GenerateFormProps {
  withImage: boolean;
  onGenerate: (images: OpenAIImage[]) => void;
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<GenerateAIAvatarActionResponse>;
}

export function GenerateAIAvatarForm({
  withImage,
  onGenerate,
  serverAction,
}: GenerateFormProps) {
  const [state, formAction, isPending] = useActionState(serverAction, null);

  useEffect(() => {
    if (state && state.payload) {
      onGenerate(state.payload);
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
          defaultValue={state?.inputs?.prompt}
          className={
            state?.errors?.prompt?.[0]
              ? "border-destructive/50 dark:border-destructive"
              : ""
          }
          required
        />
        {state?.errors?.prompt && (
          <p
            id={`prompt-error`}
            className="text-sm text-destructive [&>svg]:text-destructive"
          >
            {state.errors.prompt[0]}
          </p>
        )}
      </div>

      {withImage && (
        <>
          <Separator />
          <ImageUploader
            title="Drag & drop an image here, or click to select"
            description="Supports: PNG"
            accept={{ "image/png": [".png"] }}
            maxSize={4 * 1024 * 1024}
            isFormSubmitted={isPending}
            isValidationError={!!state?.errors?.imageFile?.[0]}
          />
        </>
      )}

      <ServerActionAlertMessage state={state} />
      <SubmitButton>Generate</SubmitButton>
    </form>
  );
}
