"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/SubmitButton";
import { generateLLMAvatarWithImage } from "@/app/actions/avatar";
import ServerActionAlertMessage from "../ServerActionAlertMessage";
import type { Image as OpenAIImage } from "openai/resources/images.mjs";
import { fileArrayToFileList } from "@/lib/utils";
import { X, LucideImage } from "lucide-react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Separator } from "../ui/separator";

interface GenerateAvatarWithImageFormProps {
  onGenerate: (images: OpenAIImage[]) => void;
}

export function GenerateAvatarWithImage({
  onGenerate,
}: GenerateAvatarWithImageFormProps) {
  const [state, formAction] = useActionState(generateLLMAvatarWithImage, null);

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
      <Separator />
      <ImageUploader />
      <Separator />

      <ServerActionAlertMessage state={state} />
      <SubmitButton>Generate</SubmitButton>
    </form>
  );
}

function ImageUploader() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      if (fileInputRef.current) {
        fileInputRef.current.files = fileArrayToFileList(acceptedFiles);
      }
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    fileRejections.forEach(({ file, errors }) => {
      errors.forEach((err) => {
        console.error(`Error uploading ${file.name}: ${err.message}`);
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { "image/png": [".png"] },
    maxFiles: 1,
    multiple: false,
    maxSize: 4 * 1024 * 1024, // 4MB
  });

  const removeImage = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    // Cleanup the object URL when component unmounts or preview changes
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <div className="space-y-4">
      <Label htmlFor="image-file">Avatar Image</Label>
      <input
        type="file"
        id="image-file"
        name="image-file"
        ref={fileInputRef}
        className="sr-only" // "Required" message will appear even if it's hidden
        required={true}
      />
      <div
        {...getRootProps()}
        className={`border-2 rounded-lg p-4 cursor-pointer text-center transition-colors
          ${preview ? "border-solid" : "border-dashed"}
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative h-48 mx-auto">
            <Image
              src={preview}
              alt="preview"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "contain" }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2 py-4">
            <LucideImage className="mx-auto h-8 w-8" />
            <p className="text-base">Drag & drop an image here, or click to select</p>
            <p className="text-sm text-gray-500">Supports: PNG (max 4MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
