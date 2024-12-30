import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeString(input: string): string {
  return input.replace(/\s+/g, "-").toLowerCase();
}

export function sanitizeFileName(fileName: string): string {
  /**
   * This function sanitizes a file name by removing or replacing characters
   * that are not allowed in file names on most file systems.
   *
   * Rules for sanitization:
   * 1. Replace invalid characters (like \ / : * ? " < > |) with underscores (_).
   * 2. Trim whitespace from the beginning and end of the filename.
   * 3. If the filename is empty after sanitization, return a default name like 'default_filename'.
   * 4. Limit the length of the file name to 255 characters (common file system limit).
   */

  // Define the characters that are not allowed in file names
  const invalidCharactersRegex = /[\\/:*?"<>|]/g;

  // Replace invalid characters with an underscore (_)
  let sanitizedFileName = fileName.replace(invalidCharactersRegex, "_");

  // Trim whitespace from the start and end of the filename
  sanitizedFileName = sanitizedFileName.trim();

  // If the filename is empty after sanitization, set a default filename
  if (sanitizedFileName === "") {
    sanitizedFileName = "default_filename";
  }

  // Limit the filename to 255 characters (file system limit for most operating systems)
  if (sanitizedFileName.length > 255) {
    sanitizedFileName = sanitizedFileName.substring(0, 255);
  }

  return sanitizedFileName;
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

export function formatDate(date: Date): string {
  const pad = (num: number): string => num.toString().padStart(2, "0");

  const d = new Date(date);
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1); // Months are 0-indexed
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function isValidFileUpload(file: File | null | undefined): boolean {
  if (!file || !(file instanceof File)) return false;

  const isEmptyDefaultFile =
    file.size === 0 &&
    file.type === "application/octet-stream" &&
    file.name === "undefined";

  return !isEmptyDefaultFile;
}
