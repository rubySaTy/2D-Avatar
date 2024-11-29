import didApi from "../lib/d-idApi";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  DIDCreateTalkApiResponse,
  DIDGetTalkApiResponse,
  PollConfig,
} from "../lib/types";

export async function createIdleVideo(imageUrl: string) {
  try {
    const res = await didApi.post<DIDCreateTalkApiResponse>("", {
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
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return null;
  }
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

async function fetchWithRetries<T>(
  url: string,
  config: AxiosRequestConfig = {},
  pollConfig: PollConfig<T>
): Promise<AxiosResponse<T>> {
  const { maxRetries, initialRetryDelay, maxRetryDelay, shouldRetry } =
    pollConfig;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await didApi<T>(url, config);

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
