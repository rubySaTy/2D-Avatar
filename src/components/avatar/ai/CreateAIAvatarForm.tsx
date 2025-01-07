"use client";

import { useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SelectAndCreateAvatar } from "@/components/avatar/ai/SelectAndCreateAvatar";
import { GenerateAIAvatarForm } from "./GenerateAIAvatarForm";
import {
  generateAIAvatarAction,
  generateAIAvatarWithImageAction,
} from "@/app/actions/avatar";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";

interface AIAvatarFormProps {
  withImage?: boolean;
  onClose: () => void;
}

export function CreateAIAvatarForm({ withImage = false, onClose }: AIAvatarFormProps) {
  const [images, setImages] = useState<OpenAIImage[]>([]);

  const handleGenerate = (newImages: OpenAIImage[]) => {
    setImages(newImages);
  };

  const handleRegenerate = () => {
    setImages([]);
  };

  const FormComponent = (
    <GenerateAIAvatarForm
      withImage={withImage}
      onGenerate={handleGenerate}
      serverAction={withImage ? generateAIAvatarWithImageAction : generateAIAvatarAction}
    />
  );

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>AI Avatar Generation</DialogTitle>
        <DialogDescription>Create a new avatar with AI generation</DialogDescription>
      </DialogHeader>

      {images.length === 0 ? (
        FormComponent
      ) : (
        <SelectAndCreateAvatar
          images={images}
          onRegenerate={handleRegenerate}
          onClose={onClose}
        />
      )}
    </div>
  );
}
