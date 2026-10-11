export const GLOSSARY_CATEGORIES = [
  "기초",
  "주식",
  "채권·금리",
  "투자상품",
  "거시경제",
  "금융상식",
] as const;
export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryTerm {
  term: string;
  english: string;
  category: GlossaryCategory;
  /** 난이도 */
  level: "기초" | "심화";
  definition: string;
  /** 비어 있을 수 있음(사용자가 추가한 용어) */
  example: string;
  /** 초보자용 일상 속 비유. 비어 있을 수 있음 */
  analogy: string;
  /** 사용자가 직접 추가한 용어 */
  custom?: boolean;
  /** 추가한 시각(ISO) — 사용자 추가 용어 */
  addedAt?: string;
  /** 카드뉴스에 마지막으로 등장한 기사 날짜(YYYY-MM-DD) */
  lastSeenDate?: string;
}
