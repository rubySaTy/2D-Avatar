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
  languages: Language[];
  access: string;
  provider: string;
  styles: string[];
}

export interface ProviderConfig {
  type: string;
  voice_id: string;
  voice_config: {
    style?: string;
  };
}

export interface DIDCreateTalkApiResponse {
  id: string;
  created_at: string;
  created_by: string;
  status: string;
  object: string;
}

export interface DIDGetTalkApiResponse {
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

export interface RetryConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
}

export interface PollConfig<T> extends RetryConfig {
  shouldRetry: (data: T) => boolean;
}
