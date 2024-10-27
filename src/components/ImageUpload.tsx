"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { type FileRejection, useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { X, Image as LucideImage } from "lucide-react";
import { fileArrayToFileList } from "@/lib/utils";

export default function ImageUploader() {
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
        // Handle errors, e.g., display a message to the user
        console.error(`Error uploading ${file.name}: ${err.message}`);
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
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
    <div className="space-y-2">
      <Label htmlFor="imageFile">Avatar Image</Label>
      <input
        type="file"
        id="imageFile"
        name="imageFile"
        ref={fileInputRef}
        className="sr-only" // "Required" message will appear even if it's hidden
        required
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
            <p className="text-base">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports: JPG, PNG, WebP (max 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
