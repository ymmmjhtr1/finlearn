export type NewsCategory = "시장" | "금리" | "기업" | "환율";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  points: string[];
  terms: string[];
  source: string;
  url?: string;
  publishedAt: string;
}
