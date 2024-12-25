"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { Label } from "@/components/ui/label";
import { Mic, X, Info } from "lucide-react";
import { fileArrayToFileList } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceFile {
  file: File;
  preview: string;
  name: string;
}

export default function VoiceUpload() {
  const [voiceFiles, setVoiceFiles] = useState<VoiceFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    setVoiceFiles((prev) => {
      const updated = [...prev, ...newFiles].slice(0, 25);

      if (fileInputRef.current) {
        fileInputRef.current.files = fileArrayToFileList(
          updated.map((item) => item.file)
        );
      }

      return updated;
    });
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
    accept: {
      "audio/*": [],
      "video/*": [],
    },
    maxFiles: 25,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeVoiceFile = useCallback((index: number) => {
    setVoiceFiles((prev) => {
      const fileToRemove = prev[index];
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      const updated = prev.filter((_, i) => i !== index).slice(0, 25);

      // Update hidden input
      if (fileInputRef.current) {
        fileInputRef.current.files = fileArrayToFileList(
          updated.map((item) => item.file)
        );
      }

      return updated;
    });
  }, []);

  useEffect(() => {
    // Cleanup the object URLs when component unmounts or voiceFiles change
    return () => {
      voiceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, [voiceFiles]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Label htmlFor="voice-files">Voice Samples</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Sample quality is more important than quantity. Noisy samples
                may give bad results. Providing more than 5 minutes of audio in
                total brings little improvement.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <input
        type="file"
        id="voice-files"
        name="voice-files"
        ref={fileInputRef}
        multiple
        className="sr-only"
        required
      />

      <div
        {...getRootProps()}
        className={`border-2 border-solid rounded-lg p-4 cursor-pointer text-center transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:border-primary"
          }`}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {voiceFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {voiceFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border border-solid rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4 text-gray-400" />
                    <span className="text-sm truncate max-w-[150px]">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVoiceFile(index);
                    }}
                    className="p-1 hover:bg-red-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <Mic className="mx-auto h-8 w-8" />
              <p className="text-base">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Audio or Video files (1-25 files, up to 10MB each)
              </p>
            </div>
          )}
        </div>
      </div>

      {voiceFiles.length > 0 && (
        <p className="text-sm text-gray-500">
          {voiceFiles.length}/25 files selected
        </p>
      )}
    </div>
  );
}
