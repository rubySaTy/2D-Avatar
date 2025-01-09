import { Image as OpenAIImage } from "openai/resources/images.mjs";

interface Language {
  locale: string;
  language: string;
  preview: string;
}

export interface MicrosoftVoice {
  id: string;
  name: string;
  description: string;
  gender: string;
  ageGroup: string;
  languages: Language[];
  access: string;
  provider: string;
  styles: string[];
}

export interface VoiceProviderConfig {
  type: string;
  voice_id: string;
  voice_config: {
    style?: string;
  };
}

export interface DIDCreateTalkResponse {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  object: string;
}

export interface DIDGetTalkResponse {
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
  webhook?: string;
}

export interface DIDCreateWebRTCStreamResponse {
  id: string;
  offer: RTCSessionDescriptionInit;
  ice_servers: RTCIceServer[];
  session_id: string;
}

export interface DIDCreateTalkStreamResponse {
  status: string;
  video_id: string;
}

interface DIDCredit {
  owner_id: string;
  expire_at: string;
  created_at: string;
  remaining: number;
  valid_from: string;
  last_charge_entity_id: string;
  total: number;
  product_billing_interval: string;
  plan_group: string;
  product_id: string;
  modified_at: string;
  price_id: string;
}

export interface DIDCreditsResponse {
  credits: DIDCredit[];
  remaining: number;
  total: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
}

export interface PollConfig<T> extends RetryConfig {
  shouldRetry: (data: T) => boolean;
}

export interface OpenAIChatMessage {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
}

export interface MessageHistory {
  type: "incoming" | "outgoing";
  content: string;
  timestamp: string;
}

export interface ActionResponse<T> {
  success: boolean;
  message: string;
  errors?: {
    [K in keyof T]?: string[];
  };
  inputs?: T;
}

export interface BaseUserFormData {
  username: string;
  email: string;
  role: string;
  password?: string;
}

export interface BaseAvatarFormData {
  avatarName: string;
  associatedUsersIds?: string[];
  imageFile?: File;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

interface GenerateAIAvatarFormData {
  prompt: string;
  imageFile?: File;
}

export interface GenerateAIAvatarActionResponse
  extends ActionResponse<GenerateAIAvatarFormData> {
  payload?: OpenAIImage[];
}

export interface CreateAIAvatarFormData {
  avatarName: string;
  imageUrl: string;
}
