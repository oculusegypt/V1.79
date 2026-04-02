export interface ZakiyPromise {
  text: string;
  date: string;
  broken: boolean;
  brokenCount: number;
}

export interface ZakiySlip {
  sin: string;
  date: string;
  afterPromise: boolean;
}

export interface ZakiyMemoryData {
  traits: string[];
  challenges: string[];
  recentTopics: string[];
  personalNote: string;
  promises: ZakiyPromise[];
  slips: ZakiySlip[];
}

export interface ServerResponseSegment {
  type: "text" | "quran" | "fatwa" | "promise" | "surah-link";
  text: string;
  audioBase64?: string;
  surah?: number;
  ayah?: number;
  source?: string;
  url?: string;
}
