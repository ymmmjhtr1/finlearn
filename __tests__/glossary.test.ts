import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { glossaryTerms } from "@/data/glossary";
import { buildTermPattern, findMentioned } from "@/lib/glossary-match";
import {
  buildTerms,
  emptyStore,
  loadStoredGlossary,
  mergeStores,
  normalizeName,
  saveStoredGlossary,
  type StoredGlossary,
} from "@/lib/glossary-storage";
import { DEFINITION_MAX, EXAMPLE_MAX, TERM_MAX, validateInput } from "@/lib/glossary-validate";
import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from "@/lib/storage-keys";
import type { GlossaryTerm } from "@/types/glossary";

const custom = (term: string, over: Partial<GlossaryTerm> = {}): GlossaryTerm => ({
  term,
  english: "",
  category: "금융상식",
  level: "기초",
  definition: `${term} 설명`,
  example: "",
  analogy: "",
  custom: true,
  ...over,
});

/** node 환경에는 localStorage가 없으므로 Map 기반 가짜를 주입한다. */
function stubLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
  };
  vi.stubGlobal("localStorage", storage);
  return { data, storage };
}

afterEach(() => vi.unstubAllGlobals());

describe("normalizeName", () => {
  it("공백을 제거하고 소문자로 맞춘다", () => {
    expect(normalizeName(" 기준 금리 ")).toBe("기준금리");
    expect(normalizeName("E T F")).toBe("etf");
  });
});

describe("loadStoredGlossary / saveStoredGlossary", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("저장소를 쓸 수 없거나 값이 없으면 null", () => {
    expect(loadStoredGlossary()).toBeNull(); // localStorage 미정의
    stubLocalStorage();
    expect(loadStoredGlossary()).toBeNull();
  });

  it("저장한 값을 그대로 읽어 온다", () => {
    const { data } = stubLocalStorage();
    const store: StoredGlossary = { custom: [custom("스톡옵션", { addedAt: "2026-01-01T00:00:00.000Z" })], seen: { 환율: "2026-10-12" } };
    saveStoredGlossary(store);
    expect(data.has(STORAGE_KEYS.GLOSSARY)).toBe(true);
    expect(loadStoredGlossary()).toEqual(store);
  });

  it("새 키가 없으면 이전 키(legacy)에서 마이그레이션해 읽는다", () => {
    const legacy = JSON.stringify({ custom: [custom("레거시용어")], seen: { 코스피: "2026-09-01" } });
    stubLocalStorage({ [LEGACY_STORAGE_KEYS.GLOSSARY]: legacy });
    const loaded = loadStoredGlossary();
    expect(loaded?.custom.map((t) => t.term)).toEqual(["레거시용어"]);
    expect(loaded?.seen).toEqual({ 코스피: "2026-09-01" });
  });

  it("새 키가 있으면 이전 키보다 우선한다", () => {
    stubLocalStorage({
      [STORAGE_KEYS.GLOSSARY]: JSON.stringify({ custom: [custom("새용어")], seen: {} }),
      [LEGACY_STORAGE_KEYS.GLOSSARY]: JSON.stringify({ custom: [custom("옛용어")], seen: {} }),
    });
    expect(loadStoredGlossary()?.custom.map((t) => t.term)).toEqual(["새용어"]);
  });

  it("깨진 JSON이나 잘못된 구조는 null", () => {
    stubLocalStorage({ [STORAGE_KEYS.GLOSSARY]: "{not json" });
    expect(loadStoredGlossary()).toBeNull();
    stubLocalStorage({ [STORAGE_KEYS.GLOSSARY]: JSON.stringify({ custom: "x", seen: {} }) });
    expect(loadStoredGlossary()).toBeNull();
    stubLocalStorage({ [STORAGE_KEYS.GLOSSARY]: JSON.stringify({ custom: [], seen: null }) });
    expect(loadStoredGlossary()).toBeNull();
  });

  it("손상된 항목을 걸러내고 누락된 필드를 기본값으로 채운다", () => {
    stubLocalStorage({
      [STORAGE_KEYS.GLOSSARY]: JSON.stringify({
        custom: [
          { term: "정상", definition: "설명", category: "주식", level: "심화", english: "OK", example: "예", analogy: "비유", addedAt: "2026-01-01" },
          { term: "필드누락", definition: "설명", category: "없는분류", level: "중급" },
          { term: "  ", definition: "공백 이름" },
          { term: "설명없음" },
          null,
        ],
        seen: { 환율: "2026-10-01", 잘못: 123 },
      }),
    });
    const loaded = loadStoredGlossary()!;
    expect(loaded.custom).toHaveLength(2);
    expect(loaded.custom[0]).toMatchObject({ term: "정상", category: "주식", level: "심화", english: "OK", custom: true });
    expect(loaded.custom[1]).toMatchObject({
      term: "필드누락",
      category: "금융상식",
      level: "기초",
      english: "",
      example: "",
      analogy: "",
      custom: true,
    });
    expect(loaded.custom[1].addedAt).toBeUndefined();
    expect(loaded.seen).toEqual({ 환율: "2026-10-01" });
  });

  it("저장 중 오류가 나도 예외를 던지지 않는다", () => {
    const { storage } = stubLocalStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveStoredGlossary(emptyStore())).not.toThrow();
  });
});

describe("mergeStores", () => {
  it("이름이 겹치면(공백·대소문자 무시) 현재 값을 유지하고 새 항목만 뒤에 붙인다", () => {
    const current: StoredGlossary = { custom: [custom("Stock Option", { definition: "현재" })], seen: {} };
    const saved: StoredGlossary = {
      custom: [custom("stockoption", { definition: "저장" }), custom("신규용어")],
      seen: {},
    };
    const merged = mergeStores(saved, current);
    expect(merged.custom.map((t) => t.term)).toEqual(["Stock Option", "신규용어"]);
    expect(merged.custom[0].definition).toBe("현재");
  });

  it("등장 날짜는 더 최근 값을 쓰고 양쪽 기록을 모두 보존한다", () => {
    const merged = mergeStores(
      { custom: [], seen: { 환율: "2026-10-10", 코스피: "2026-10-01" } },
      { custom: [], seen: { 환율: "2026-10-12", 금리: "2026-09-30" } }
    );
    expect(merged.seen).toEqual({ 환율: "2026-10-12", 코스피: "2026-10-01", 금리: "2026-09-30" });
  });

  it("입력 객체를 변경하지 않는다", () => {
    const saved: StoredGlossary = { custom: [], seen: { 환율: "2026-10-10" } };
    const current: StoredGlossary = { custom: [], seen: { 환율: "2026-10-12" } };
    mergeStores(saved, current);
    expect(saved.seen).toEqual({ 환율: "2026-10-10" });
  });
});

describe("buildTerms", () => {
  it("빈 저장소면 기본 용어 목록과 같다", () => {
    expect(buildTerms(emptyStore())).toEqual(glossaryTerms);
  });

  it("사용자 용어를 최신순으로 기본 용어 앞에 둔다", () => {
    const store: StoredGlossary = {
      custom: [
        custom("오래된", { addedAt: "2026-01-01T00:00:00.000Z" }),
        custom("최신", { addedAt: "2026-06-01T00:00:00.000Z" }),
      ],
      seen: {},
    };
    const terms = buildTerms(store);
    expect(terms.slice(0, 2).map((t) => t.term)).toEqual(["최신", "오래된"]);
    expect(terms).toHaveLength(glossaryTerms.length + 2);
  });

  it("기본 용어와 이름이 겹치는 사용자 용어는 숨기고 기본 용어를 보존한다", () => {
    const base = glossaryTerms[0];
    const terms = buildTerms({ custom: [custom(` ${base.term} `)], seen: {} });
    expect(terms).toHaveLength(glossaryTerms.length);
    expect(terms.find((t) => t.term === base.term)).toEqual(base);
  });

  it("뉴스 등장 날짜(lastSeenDate)를 입힌다", () => {
    const base = glossaryTerms[0];
    const terms = buildTerms({ custom: [custom("내용어")], seen: { [base.term]: "2026-10-12", 내용어: "2026-10-11" } });
    expect(terms.find((t) => t.term === base.term)?.lastSeenDate).toBe("2026-10-12");
    expect(terms.find((t) => t.term === "내용어")?.lastSeenDate).toBe("2026-10-11");
  });
});

describe("buildTermPattern / findMentioned", () => {
  it("2글자 미만 이름만 있으면 null이고 매칭 결과는 빈 배열이다", () => {
    expect(buildTermPattern([])).toBeNull();
    expect(buildTermPattern(["금", " "])).toBeNull();
    expect(findMentioned("금리가 올랐다", null)).toEqual([]);
  });

  it("본문에 등장하는 용어를 등장 순서대로, 중복 없이 찾는다", () => {
    const pattern = buildTermPattern(["환율", "코스피", "금리"]);
    expect(findMentioned("코스피가 오르고 환율이 내렸다. 금리와 코스피 모두 주목.", pattern)).toEqual([
      "코스피",
      "환율",
      "금리",
    ]);
  });

  it("긴 용어를 먼저 매칭한다", () => {
    const pattern = buildTermPattern(["금리", "기준금리"]);
    expect(findMentioned("한국은행이 기준금리를 동결했다", pattern)).toEqual(["기준금리"]);
  });

  it("영문 용어는 단어 경계를 지킨다", () => {
    const pattern = buildTermPattern(["ETF", "PER"]);
    expect(findMentioned("ETF와 PER을 비교", pattern)).toEqual(["ETF", "PER"]);
    expect(findMentioned("PAPER와 ETFs는 제외", pattern)).toEqual([]);
  });

  it("정규식 특수문자가 들어간 용어도 안전하게 매칭한다", () => {
    const pattern = buildTermPattern(["M&A", "P/E(배)", "C++"]);
    expect(findMentioned("M&A 시장, P/E(배) 지표, C++ 언급", pattern)).toEqual(["M&A", "P/E(배)", "C++"]);
  });

  it("같은 정규식을 여러 번 써도 결과가 일정하다 (전역 플래그 상태 비의존)", () => {
    const pattern = buildTermPattern(["환율"]);
    expect(findMentioned("환율 환율", pattern)).toEqual(["환율"]);
    expect(findMentioned("환율 환율", pattern)).toEqual(["환율"]);
  });

  it("기본 용어 사전의 실제 용어를 기사 문장에서 찾아낸다", () => {
    const pattern = buildTermPattern(glossaryTerms.map((t) => t.term));
    const found = findMentioned("한국은행이 기준금리를 동결하자 환율이 안정됐다", pattern);
    expect(found).toContain("기준금리");
    expect(found).toContain("환율");
  });
});

describe("validateInput", () => {
  const terms = [custom("스톡옵션", { english: "Stock Option" })];
  const input = { term: "신규 용어", definition: "설명", example: "" };

  it("공백을 정리한 값을 돌려준다", () => {
    expect(validateInput({ term: "  신규   용어 ", definition: " 설명 ", example: " 예 " }, terms)).toEqual({
      ok: true,
      name: "신규 용어",
      definition: "설명",
      example: "예",
    });
  });

  it("길이 제한과 필수값을 검사한다", () => {
    expect(validateInput({ ...input, term: "가" }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, term: "가".repeat(TERM_MAX + 1) }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, definition: "  " }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, definition: "가".repeat(DEFINITION_MAX + 1) }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, example: "가".repeat(EXAMPLE_MAX + 1) }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, term: "가".repeat(TERM_MAX) }, terms).ok).toBe(true);
  });

  it("한글·영문 이름 중복을 거절하되 편집 중인 자기 자신은 허용한다", () => {
    expect(validateInput({ ...input, term: "스톡 옵션" }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, term: "stock option" }, terms)).toMatchObject({ ok: false });
    expect(validateInput({ ...input, term: "스톡옵션" }, terms, normalizeName("스톡옵션")).ok).toBe(true);
  });
});
