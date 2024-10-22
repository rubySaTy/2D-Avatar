"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ImageUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload an image file");
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-colors",
          dragActive ? "border-primary" : "border-muted-foreground",
          image ? "bg-muted" : "bg-background"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <Input
          id="picture"
          name="picture"
          type="file"
          ref={inputRef}
          className="hidden"
          onChange={handleChange}
          accept="image/*"
          required
        />
        {image ? (
          <img
            src={image}
            alt="Uploaded preview"
            className="max-w-full max-h-48 mx-auto"
          />
        ) : (
          <div className="text-center">
            <p>Drag and drop your image here or click to select</p>
          </div>
        )}
      </div>
      {dragActive && (
        <div className="absolute inset-0 bg-primary/20 pointer-events-none" />
      )}
    </>
  );
}
