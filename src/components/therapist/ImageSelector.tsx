"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";

interface ImageSelectorProps {
  images: OpenAIImage[];
  selectedImage: OpenAIImage | null;
  setSelectedImage: (selectedImage: OpenAIImage) => void;
}

export default function ImageSelector({
  images,
  selectedImage,
  setSelectedImage,
}: ImageSelectorProps) {
  const [loadedImages, setLoadedImages] = useState(0);

  const isSingleImage = images.length === 1;

  useEffect(() => {
    if (loadedImages === images.length) {
      if (isSingleImage) setSelectedImage(images[0]);
    }
  }, [loadedImages, images.length]);

  return (
    <div
      className={cn(
        "grid gap-4",
        isSingleImage ? "grid-cols-1" : "grid-cols-2",
        "w-full h-full"
      )}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            "relative cursor-pointer rounded-md overflow-hidden aspect-square ring-2 ring-transparent transition-all duration-200 ease-in-out",
            selectedImage === image && "ring-primary"
          )}
          onClick={() => setSelectedImage(image)}
        >
          <Image
            src={image.url!}
            alt={`Selectable image ${index + 1}`}
            style={{ objectFit: "contain" }}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setLoadedImages((prev) => prev + 1)}
          />
          {selectedImage === image && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <Check className="text-primary-foreground w-6 h-6" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
