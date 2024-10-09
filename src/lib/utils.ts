import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";

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

interface DIDCreateTalkApiResponse {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  object: string;
}

export async function createIdleVideo(imageUrl: string) {
  try {
    const res = await axios<DIDCreateTalkApiResponse>(
      `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${process.env.DID_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: {
          source_url: imageUrl,
          driver_url: "bank://lively/driver-06",
          script: {
            type: "text",
            ssml: true,
            input:
              '<break time="5000ms"/><break time="5000ms"/><break time="5000ms"/>',
            provider: {
              type: "microsoft",
              voice_id: "en-US-JennyNeural",
            },
          },
          config: { fluent: true },
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

interface DIDGetTalkApiResponse {
  user: {
    features: (string | null)[];
    stripe_customer_id: string;
    stripe_plan_group: string;
    authorizer: string;
    owner_id: string;
    id: string;
    plan: string;
    email: string;
    stripe_price_id: string;
  };
  script: {
    length: number;
    ssml: boolean;
    subtitles: boolean;
    type: string;
    provider: {
      type: string;
      voice_id: string;
    };
  };
  metadata: {
    driver_url: string;
    mouth_open: boolean;
    num_faces: number;
    num_frames: number;
    processing_fps: number;
    resolution: [number, number];
    size_kib: number;
  };
  audio_url: string;
  created_at: string;
  face: {
    mask_confidence: number;
    detection: [number, number, number, number];
    overlap: string;
    size: number;
    top_left: [number, number];
    face_id: number;
    detect_confidence: number;
  };
  config: {
    stitch: boolean;
    align_driver: boolean;
    sharpen: boolean;
    normalization_factor: number;
    result_format: string;
    fluent: boolean;
    pad_audio: number;
    reduce_noise: boolean;
    auto_match: boolean;
    show_watermark: boolean;
    logo: {
      url: string;
      position: [number, number];
    };
    motion_factor: number;
    align_expand_factor: number;
  };
  source_url: string;
  created_by: string;
  status: string;
  driver_url: string;
  modified_at: string;
  user_id: string;
  subtitles: boolean;
  id: string;
  duration: number;
  started_at: string;
  result_url: string;
}

export async function getIdleVideo(
  id: string
): Promise<DIDGetTalkApiResponse | null> {
  try {
    const url = `${process.env.DID_API_URL}/${process.env.DID_API_SERVICE}/${id}`;
    const config: AxiosRequestConfig = {
      method: "GET",
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const pollConfig: PollConfig<DIDGetTalkApiResponse> = {
      maxRetries: 10,
      initialRetryDelay: 1000,
      maxRetryDelay: 10000,
      shouldRetry: (data) => data.status !== "done",
    };

    const res = await fetchWithRetries<DIDGetTalkApiResponse>(
      url,
      config,
      pollConfig
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching idle video:", error);
    return null;
  }
}

interface RetryConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
}

interface PollConfig<T> extends RetryConfig {
  shouldRetry: (data: T) => boolean;
}

async function fetchWithRetries<T>(
  url: string,
  config: AxiosRequestConfig = {},
  pollConfig: PollConfig<T>
): Promise<AxiosResponse<T>> {
  const { maxRetries, initialRetryDelay, maxRetryDelay, shouldRetry } =
    pollConfig;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios<T>(url, config);

      if (!shouldRetry(response.data)) {
        return response;
      }

      const delay = Math.min(
        initialRetryDelay * Math.pow(2, attempt),
        maxRetryDelay
      );

      console.warn(
        `Status not yet 'done', retrying in ${delay}ms... (${
          attempt + 1
        }/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(
        initialRetryDelay * Math.pow(2, attempt),
        maxRetryDelay
      );

      console.warn(
        `Request failed, retrying in ${delay}ms... (${
          attempt + 1
        }/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries reached without achieving desired status");
}
