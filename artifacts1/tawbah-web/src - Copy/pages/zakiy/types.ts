export interface MessageSegment {
  type: "text" | "quran" | "fatwa" | "promise" | "surah-link";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}

export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  segments?: MessageSegment[];
  timestamp: Date;
  suggestions?: string[];
  suggestionsLoading?: boolean;
}

export interface ApiHistory {
  role: "user" | "assistant";
  content: string;
}
