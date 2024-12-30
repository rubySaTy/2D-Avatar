import didApi from "../lib/d-idApi";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  DIDCreditsResponse,
  DIDCreateTalkResponse,
  DIDCreateWebRTCStreamResponse,
  PollConfig,
  VoiceProviderConfig,
  DIDCreateTalkStreamResponse,
} from "../lib/types";
import axios from "axios";

export async function createTalkStream(
  streamId: string,
  sessionId: string,
  voiceProvider: VoiceProviderConfig,
  message?: string
): Promise<DIDCreateTalkStreamResponse> {
  const res = await didApi.post<DIDCreateTalkStreamResponse>(
    `/streams/${streamId}`,
    {
      script: {
        type: "text",
        provider: voiceProvider,
        ssml: "false",
        input: message,
      },
      config: { fluent: true, pad_audio: "0.0" },
      session_id: sessionId,
    },
    {
      headers: {
        "x-api-key-external": JSON.stringify({
          elevenlabs: process.env.ELEVENLABS_API_KEY,
        }),
      },
    }
  );

  return res.data;
}

export async function createIdleVideo(imageUrl: string) {
  const res = await didApi.post<DIDCreateTalkResponse>("", {
    source_url: imageUrl,
    driver_url: "bank://lively/driver-06",
    script: {
      type: "text",
      ssml: true,
      input: '<break time="5000ms"/><break time="5000ms"/><break time="4000ms"/>',
      provider: {
        type: "microsoft",
        voice_id: "en-US-JennyNeural",
      },
    },
    config: { fluent: true },
    webhook: `${process.env.WEBHOOK_URL}`,
  });
  return res.data;
}

export async function createWebRTCStream(imageUrl: string) {
  try {
    const sessionResponse = await didApi.post<DIDCreateWebRTCStreamResponse>("/streams", {
      source_url: imageUrl,
      stream_warmup: true,
    });

    return sessionResponse.data;
  } catch (error) {
    console.error("Failed to create a WebRTC stream:", error);
    return null;
  }
}

export async function getDIDCredits() {
  const res = await axios.get<DIDCreditsResponse>("https://api.d-id.com/credits", {
    headers: {
      Authorization: `Basic ${process.env.DID_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return res.data.remaining;
}

// TODO: add retry mechanism to axios requests?
async function fetchWithRetries<T>(
  url: string,
  config: AxiosRequestConfig = {},
  pollConfig: PollConfig<T>
): Promise<AxiosResponse<T>> {
  const { maxRetries, initialRetryDelay, maxRetryDelay, shouldRetry } = pollConfig;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await didApi<T>(url, config);

      if (!shouldRetry(response.data)) {
        return response;
      }

      const delay = Math.min(initialRetryDelay * Math.pow(2, attempt), maxRetryDelay);

      console.warn(
        `Status not yet 'done', retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(initialRetryDelay * Math.pow(2, attempt), maxRetryDelay);

      console.warn(
        `Request failed, retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries reached without achieving desired status");
}
