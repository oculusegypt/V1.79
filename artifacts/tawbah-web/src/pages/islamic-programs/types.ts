export type CategoryId =
  | "quran"
  | "dawah"
  | "fatwa"
  | "stories"
  | "radio";

export type Program = {
  id: string;
  name: string;
  host?: string;
  category: CategoryId;
  featured?: boolean;
  hot?: boolean;
  badge?: string;
  color: string;
  colorTo: string;
  icon: string;
};

export type RadioStation = {
  id: string;
  name: string;
  url: string;
  logo?: string;
  color?: string;
  colorTo?: string;
  note?: string;
};

export type PodcastEpisode = {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  mediaUrl: string;
};

export type PodcastCategory = {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  color: string;
  colorTo: string;
  episodes: PodcastEpisode[];
};
