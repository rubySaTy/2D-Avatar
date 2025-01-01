"use client";

import { useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { SelectAndCreateAvatar } from "@/components/avatar/ai/SelectAndCreateAvatar";
import {
  GenerateAIAvatarForm,
  GenerateAIAvatarWithImageForm,
} from "@/components/avatar/ai/GenerateAIAvatarForm";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";

interface AIAvatarFormProps {
  withImage?: boolean;
}

export function CreateAIAvatarForm({ withImage = false }: AIAvatarFormProps) {
  const [images, setImages] = useState<OpenAIImage[]>([]);

  const handleGenerate = (newImages: OpenAIImage[]) => {
    setImages(newImages);
  };

  const handleRegenerate = () => {
    setImages([]);
  };

  const GenerationComponent = withImage
    ? GenerateAIAvatarWithImageForm
    : GenerateAIAvatarForm;

  return (
    <motion.div transition={{ duration: 0.3 }} className="space-y-4">
      <DialogHeader>
        <DialogTitle>AI Avatar Generation</DialogTitle>
        <DialogDescription>Create a new avatar with AI generation</DialogDescription>
      </DialogHeader>

      {images.length === 0 ? (
        <GenerationComponent onGenerate={handleGenerate} />
      ) : (
        <SelectAndCreateAvatar images={images} onRegenerate={handleRegenerate} />
      )}
    </motion.div>
  );
}
