import { glossaryTerms } from "@/data/glossary";
import { GLOSSARY_CATEGORIES, type GlossaryTerm } from "@/types/glossary";

import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * localStorage에는 "기본 목록(data/glossary.ts)과 다른 부분"만 저장한다.
 * - custom: 사용자가 추가한 용어 전체
 * - seen: 용어 이름 → 카드뉴스에 마지막으로 등장한 기사 날짜
 * 기본 용어는 코드에서 항상 불러오므로, 저장된 값과 병합해도 기본 용어가 사라지지 않는다.
 */
export interface StoredGlossary {
  custom: GlossaryTerm[];
  seen: Record<string, string>;
}

export const emptyStore = (): StoredGlossary => ({ custom: [], seen: {} });

/** 이름 비교용: 공백 제거 + 소문자 */
export const normalizeName = (s: string) => s.replace(/\s+/g, "").toLowerCase();

const isStr = (v: unknown): v is string => typeof v === "string";

export function loadStoredGlossary(): StoredGlossary | null {
  try {
    // 새 키에 값이 없으면 이전 키(finlearn_glossary_terms)에서 읽는다. 다음 저장 때 새 키로 옮겨진다.
    const raw =
      localStorage.getItem(STORAGE_KEYS.GLOSSARY) ??
      localStorage.getItem(LEGACY_STORAGE_KEYS.GLOSSARY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.custom) || typeof d.seen !== "object" || !d.seen) return null;

    const custom: GlossaryTerm[] = d.custom
      .filter((t: GlossaryTerm) => t && isStr(t.term) && t.term.trim() && isStr(t.definition))
      .map((t: GlossaryTerm) => ({
        term: t.term,
        english: isStr(t.english) ? t.english : "",
        category: GLOSSARY_CATEGORIES.includes(t.category) ? t.category : "금융상식",
        level: t.level === "심화" ? "심화" : "기초",
        definition: t.definition,
        example: isStr(t.example) ? t.example : "",
        analogy: isStr(t.analogy) ? t.analogy : "",
        custom: true,
        addedAt: isStr(t.addedAt) ? t.addedAt : undefined,
      }));

    const seen: Record<string, string> = {};
    for (const [k, v] of Object.entries(d.seen)) if (isStr(v)) seen[k] = v;
    return { custom, seen };
  } catch {
    return null;
  }
}

export function saveStoredGlossary(store: StoredGlossary): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GLOSSARY, JSON.stringify(store));
  } catch {
    // 저장소를 쓸 수 없으면 이번 방문 동안만 유지
  }
}

/** 저장분을 현재(메모리) 상태에 합친다. 이름이 겹치면 기존 것을 유지하고, 등장 날짜는 더 최근 값을 쓴다. */
export function mergeStores(saved: StoredGlossary, current: StoredGlossary): StoredGlossary {
  const names = new Set(current.custom.map((t) => normalizeName(t.term)));
  const custom = [...current.custom, ...saved.custom.filter((t) => !names.has(normalizeName(t.term)))];
  const seen = { ...saved.seen };
  for (const [k, v] of Object.entries(current.seen)) if (!seen[k] || seen[k] < v) seen[k] = v;
  return { custom, seen };
}

/** 기본 용어 + 사용자 추가 용어(최신순)에 뉴스 등장 날짜를 입힌 최종 목록 */
export function buildTerms(store: StoredGlossary): GlossaryTerm[] {
  const custom = [...store.custom].sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""));
  const defaults = new Set(glossaryTerms.map((t) => normalizeName(t.term)));
  return [...custom.filter((t) => !defaults.has(normalizeName(t.term))), ...glossaryTerms].map((t) =>
    store.seen[t.term] ? { ...t, lastSeenDate: store.seen[t.term] } : t
  );
}
