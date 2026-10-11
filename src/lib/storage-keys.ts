/** localStorage 키를 한곳에서 관리한다. 키를 바꿀 때는 아래 LEGACY_STORAGE_KEYS에 이전 키를 남긴다. */
export const STORAGE_KEYS = {
  GLOSSARY: "finlearn:glossary:v1",
  PORTFOLIO: "finlearn:portfolio:v1",
  QUIZ: "finlearn:quiz:v1",
} as const;

/** 이전 버전에서 쓰던 키. 새 키에 값이 없을 때만 읽어서 마이그레이션한다. */
export const LEGACY_STORAGE_KEYS = {
  GLOSSARY: "finlearn_glossary_terms",
} as const;
