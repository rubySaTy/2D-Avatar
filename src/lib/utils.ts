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

export function shortUUID(): string {
  const uuid: string = crypto.randomUUID();

  // Remove dashes and convert to a Uint8Array
  const byteArray: Uint8Array = new Uint8Array(16);
  const hexWithoutDashes: string = uuid.replace(/[-]/g, "");

  const matches = hexWithoutDashes.match(/.{1,2}/g);
  if (matches) {
    matches.forEach((byte, i) => {
      byteArray[i] = parseInt(byte, 16);
    });
  }

  // Convert Uint8Array to a regular array and then to base64
  const base64: string = btoa(
    String.fromCharCode.apply(null, Array.from(byteArray))
  );
  return base64
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .substring(0, 10);
}
