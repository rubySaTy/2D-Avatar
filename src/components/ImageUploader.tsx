"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { type Accept, type FileRejection, useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { X, Image as LucideImage } from "lucide-react";
import { fileArrayToFileList } from "@/lib/utils";

interface ImageUploaderProps {
  title: string;
  description: string;
  maxSize?: number;
  accept?: Accept;
  isValidationError?: boolean;
  isFormSubmitted?: boolean;
}

export default function ImageUploader({
  title,
  description,
  isFormSubmitted,
  isValidationError,
  maxSize = 10 * 1024 * 1024, // default 10MB
  accept = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
  },
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset preview if the form is submitted = false
  // TOOD: find a way to keep the image if uploading fails - defaultValue not supported
  useEffect(() => {
    if (isFormSubmitted === false) {
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isFormSubmitted]);

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
        // Could also add user-friendly toast or some UI feedback here
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxFiles: 1,
    multiple: false,
    maxSize,
  });

  const removeImage = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Revoke object URLs to free up memory whenever preview changes (cleanup)
  useEffect(() => {
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
        className="sr-only"
      />

      <div
        {...getRootProps()}
        className={`border-2 rounded-lg p-4 cursor-pointer text-center transition-colors
          ${preview ? "border-solid" : "border-dashed"}
          ${
            isValidationError
              ? "border-destructive/50 dark:border-destructive"
              : isDragActive
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
                e.stopPropagation(); // Avoid triggering the dropzone
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
            <p className="text-base">{title}</p>
            <p className="text-sm text-gray-500">
              {description} (max {(maxSize / (1024 * 1024)).toFixed(0)}MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
