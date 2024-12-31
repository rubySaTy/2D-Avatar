"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ImageSelector from "@/components/therapist/ImageSelector";
import { createLLMAvatar } from "@/app/actions/avatar";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Image } from "openai/resources/images.mjs";

interface SelectAndCreateAvatarProps {
  images: Image[];
  onRegenerate: () => void;
}

export function SelectAndCreateAvatar({
  images,
  onRegenerate,
}: SelectAndCreateAvatarProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [state, formAction, isPending] = useActionState(createLLMAvatar, null);

  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      <Separator />
      <ImageSelector
        images={images}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />
      <Separator />
      {selectedImage && (
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="image-url" value={selectedImage.url} />

          <div className="space-y-2">
            <Label htmlFor="avatar-name">Avatar name</Label>
            <Input
              id="avatar-name"
              name="avatar-name"
              required
              placeholder="Give the avatar a name"
            />
          </div>
        </form>
      )}

      <ServerActionAlertMessage state={state} />
      <div className="flex justify-between">
        <Button onClick={onRegenerate} variant="destructive">
          Regenerate
        </Button>
        <Button
          onClick={() => formRef.current?.requestSubmit()}
          disabled={!selectedImage || isPending}
        >
          {isPending ? "Creating..." : "Create Avatar"}
        </Button>
      </div>
    </div>
  );
}
