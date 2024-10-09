interface Language {
  locale: string;
  language: string;
}

export interface Voice {
  id: string;
  name: string;
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
