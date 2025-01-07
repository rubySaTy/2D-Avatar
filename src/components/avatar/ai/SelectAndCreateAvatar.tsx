"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ImageSelector from "@/components/therapist/ImageSelector";
import { createAIAvatarAction } from "@/app/actions/avatar";
import ServerActionAlertMessage from "@/components/ServerActionAlertMessage";
import { Separator } from "@/components/ui/separator";
import { FormInput } from "@/components/FormInput";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";

interface SelectAndCreateAvatarProps {
  images: OpenAIImage[];
  onRegenerate: () => void;
  onClose: () => void;
}

export function SelectAndCreateAvatar({
  images,
  onRegenerate,
  onClose,
}: SelectAndCreateAvatarProps) {
  const [selectedImage, setSelectedImage] = useState<OpenAIImage | null>(null);
  const [state, formAction, isPending] = useActionState(createAIAvatarAction, null);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);
  
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
            <FormInput
              label="Avatar Name"
              id="avatar-name"
              defaultValue={state?.inputs?.avatarName}
              error={state?.errors?.avatarName?.[0]}
              placeholder="Give the avatar a name"
              required
              minLength={3}
              maxLength={20}
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
