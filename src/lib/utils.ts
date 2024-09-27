import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

interface SessionResponse {
  id: string;
  offer: RTCSessionDescriptionInit;
  ice_servers: RTCIceServer[];
  session_id: string;
}

// Initialize D-ID stream
export async function createDIDStream(sourceUrl: string) {
  try {
    const sessionResponse = await axios<SessionResponse>({
      url: `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/streams`,
      method: "POST",
      data: { source_url: sourceUrl, stream_warmup: true },
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return sessionResponse.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000, // 5 seconds timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB max size
    });

    const contentType = response.headers["content-type"];
    return contentType.startsWith("image/");
  } catch (error) {
    console.error("Error validating image URL:", error);
    return false;
  }
}
