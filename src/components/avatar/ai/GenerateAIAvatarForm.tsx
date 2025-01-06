"use client";

import { useActionState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/SubmitButton";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import {
  generateAIAvatarAction,
  generateAIAvatarWithImageAction,
} from "@/app/actions/avatar";
import { Separator } from "@/components/ui/separator";
import ImageUploader from "@/components/ImageUploader";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";

interface BaseGenerateFormProps {
  onGenerate: (images: OpenAIImage[]) => void;
  serverAction: (
    prevState: any,
    formData: FormData
  ) => Promise<
    | { success: boolean; message: string; payload?: undefined; data?: undefined }
    | { success: boolean; message: string; payload: FormData; data: OpenAIImage[] }
  >;
  children?: React.ReactNode;
}

function BaseGenerateForm({ onGenerate, serverAction, children }: BaseGenerateFormProps) {
  const [state, formAction] = useActionState(serverAction, null);

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

      {children}

      <ServerActionAlertMessage state={state} />
      <SubmitButton>Generate</SubmitButton>
    </form>
  );
}

interface GenerateAIImageProps {
  onGenerate: (images: OpenAIImage[]) => void;
}

export function GenerateAIAvatarForm({ onGenerate }: GenerateAIImageProps) {
  return (
    <BaseGenerateForm onGenerate={onGenerate} serverAction={generateAIAvatarAction} />
  );
}

export function GenerateAIAvatarWithImageForm({ onGenerate }: GenerateAIImageProps) {
  return (
    <BaseGenerateForm
      onGenerate={onGenerate}
      serverAction={generateAIAvatarWithImageAction}
    >
      <Separator />
      <ImageUploader
        title="Drag & drop an image here, or click to select"
        description="Supports: PNG"
        accept={{ "image/png": [".png"] }}
        maxSize={4 * 1024 * 1024}
      />
    </BaseGenerateForm>
  );
}
