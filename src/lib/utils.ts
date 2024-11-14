import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeString(input: string): string {
  return input.replace(/\s+/g, "-").toLowerCase();
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

// Helper function to convert File[] to FileList
export const fileArrayToFileList = (files: File[]): FileList => {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
};

export function getMessageTimestamp(): string {
  const now = new Date();

  // Format the date and time (e.g., "DD/MM/YYYY, HH:mm:ss")
  const timestamp = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // Use 24-hour format
  });

  return timestamp;
}
