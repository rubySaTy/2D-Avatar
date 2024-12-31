"use client";

import { useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { SelectAndCreateAvatar } from "@/components/therapist/SelectAndCreateAvatar";
import { GenerateAvatarWithImage } from "@/components/therapist/GenerateAvatarWithImage";
import type { Image } from "openai/resources/images.mjs";

export default function CreateLLMAvatarWithImageForm() {
  const [images, setImages] = useState<Image[]>([]);

  const handleGenerate = (newImages: Image[]) => {
    setImages(newImages);
  };

  const handleRegenerate = () => {
    setImages([]);
  };

  return (
    <motion.div transition={{ duration: 0.3 }} className="space-y-4">
      <DialogHeader>
        <DialogTitle>AI Avatar Generation</DialogTitle>
        <DialogDescription>Create a new avatar with AI generation</DialogDescription>
      </DialogHeader>

      {images.length === 0 ? (
        <GenerateAvatarWithImage onGenerate={handleGenerate} />
      ) : (
        <SelectAndCreateAvatar images={images} onRegenerate={handleRegenerate} />
      )}
    </motion.div>
  );
}
