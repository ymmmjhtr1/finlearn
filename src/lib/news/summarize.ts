import { glossaryTerms } from "@/data/glossary";
import { stocks } from "@/data/stocks";
import type { NewsCategory, NewsItem } from "@/types/news";

import { KST_OFFSET } from "./constants";
import type { Article } from "./parse";

// 본문에서 찾아 줄 기관·종목 이름 (정규식 오탐을 피하려고 목록 기반)
const ORGANIZATIONS = [
  "한국은행",
  "금융통화위원회",
  "금융위원회",
  "금융감독원",
  "기획재정부",
  "산업통상자원부",
  "공정거래위원회",
  "국민연금",
  "기획예산처",
  "국토교통부",
  "국토부",
  "금융위",
  "금감원",
  "산업부",
  "과기정통부",
  "고용노동부",
  "보건복지부",
  "통계청",
  "관세청",
  "국세청",
  "한국거래소",
  "연준",
  "Fed",
  "ECB",
  "IMF",
  "OPEC",
  ...stocks.map((s) => s.name),
];

// 숫자 + 단위 (3,050선, 2.50%, 1,360원, 4조 원, 5거래일 …)
const FIGURE =
  /\d[\d,]*(?:\.\d+)?\s?(?:%포인트|%p|%|bp|원|달러|엔|위안|조\s?원|억\s?원|만\s?원|조|억|만|배|선|포인트|p|거래일|분기|개월)(?![가-힣])/g;

/** 제목 끝의 (종합), (2보) 같은 편집 표시와 앞쪽 [속보] 말머리를 제거 */
export function stripEditorMarks(title: string): string {
  return title
    .replace(/\s*\((?:종합|상보|속보|\d+보|종합\d*보?|재송|수정)[^)]*\)\s*$/g, "")
    // 꼬리말 태그: 제목 끝의 [종합], <사진> 등
    .replace(/(?:\s*(?:\[[^\]]*\]|<[^>]*>))+\s*$/, "")
    // [마켓스토리], [뉴욕증시-주간전망], (서울=연합뉴스), <포토> 같은 앞쪽 머리말 태그
    .replace(/^\s*(?:(?:\[[^\]]*\]|\([^)]*\)|<[^>]*>)\s*)+/, "")
    .trim();
}

/** 제목을 쉼표·말줄임표·가운뎃점 기준으로 나눠 간결한 개조식 문장으로 재구성 */
export function titleToBullet(title: string): string {
  const fragments = stripEditorMarks(title)
    .replace(/["“”'‘’]/g, "")
    .split(/\s*(?:…|\.{2,}|,|·|ㆍ|—|–)\s*/)
    .map((f) => f.trim())
    .filter((f) => f.length >= 2);
  return fragments.join(" · ");
}

/** 문장 단위 분리: 마침표/물음표/느낌표 뒤 공백, 줄바꿈 기준 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/[^가-힣A-Za-z0-9]/g, "").length >= 8);
}

const TRAILING_ELLIPSIS = /\s*(?:\.{2,}|…)$/;

/** 마침표/물음표/느낌표(뒤에 따옴표·괄호가 올 수 있음)로 끝나고 말줄임표로 끝나지 않으면 완결 문장 */
export function isCompleteSentence(s: string): boolean {
  if (TRAILING_ELLIPSIS.test(s.replace(/["'”’)\]]+$/, ""))) return false;
  return /[.!?]["'”’)\]]*$/.test(s);
}

// 서술형 종결 어미 (마침표가 없어도 문장으로 볼 수 있는 끝맺음)
const FINAL_ENDING = /(?:[가-힣]다|[가-힣]요|[가-힣]죠|[가-힣]음|[가-힣]함|[가-힣]됨|[가-힣]임)$/;
const TRAILING_JUNK = /[\s"'“”‘’)\]>」』…·\-–—:;,~!?.]+$/;

/**
 * 마침표 없는 문장·제목 조각을 요약문으로 다듬는다. 기사에 없는 서술은 만들어 붙이지 않는다.
 * - 인용부호를 제거하고 끝의 특수문자·공백을 정리한다.
 * - 서술형 종결(~다, ~요, ~음, ~함, ~됨, ~임 …)이면 마침표만 붙인다.
 * - 화살표(↑▲/↓▼)로 끝나면 "상승했습니다."/"하락했습니다."로 바꾼다. (의미가 명확한 변환)
 * - 그 밖의 조각(연결 어미·조사·명사형 등)은 문장으로 만들지 않고 정리된 원문 그대로 돌려준다.
 */
export function toSummarySentence(text: string): string {
  // 인용부호를 떼고 끝의 특수문자를 정리한다 (여는 따옴표만 남는 것을 막으려고 전부 제거)
  let t = text.replace(/["“”'‘’「」『』]/g, "").trim();

  // 화살표로 끝나는 제목: "코스피 2%↑" → "코스피 2% 상승했습니다."
  const arrow = t.match(/\s*([↑▲△⬆]|[↓▼▽⬇])\s*$/);
  if (arrow) {
    const rest = t.slice(0, arrow.index).replace(TRAILING_JUNK, "").trim();
    if (rest) return `${rest} ${/[↑▲△⬆]/.test(arrow[1]) ? "상승했습니다" : "하락했습니다"}.`;
  }

  t = t.replace(TRAILING_JUNK, "").trim();
  if (!t) return text.trim();
  if (FINAL_ENDING.test(t)) return `${t}.`;

  // 서술형이 아닌 조각은 문장으로 만들려 하지 않고 원문 그대로 둔다. (기사에 없는 서술을 덧붙이지 않음)
  return t;
}

/** 완결 문장이 없을 때, 본문의 쉼표 구분 조각 중 서술형으로 끝나는 첫 조각 */
export function pickFragment(body: string): string | null {
  const parts = body.split(/\s*(?:,|·|ㆍ)\s*/).map((p) => p.trim());
  // 말줄임표로 끝난 마지막 조각은 잘린 것이므로 제외한다.
  if (parts.length > 0 && TRAILING_ELLIPSIS.test(parts[parts.length - 1])) parts.pop();
  return (
    parts.find((p) => normalize(p).length >= 10 && FINAL_ENDING.test(p.replace(TRAILING_JUNK, ""))) ??
    null
  );
}

const SUMMARY_MAX = 120;
const SHORT_SENTENCE = 60;

/**
 * 첫 완결 문장을 요약으로 쓴다. 문장을 자르지 않으며, 첫 문장이 짧고
 * 두 문장을 합쳐도 SUMMARY_MAX 이내일 때만 두 번째 문장을 이어 붙인다.
 */
export function buildSummary(sentences: string[]): string | null {
  const [first, second] = sentences;
  if (!first) return null;
  if (first.length < SHORT_SENTENCE && second && first.length + second.length + 1 <= SUMMARY_MAX) {
    return `${first} ${second}`;
  }
  return first;
}

export const normalize = (s: string) => s.replace(/[^가-힣A-Za-z0-9]/g, "");

/** 이미 나온 문장과 사실상 같은 내용이면 true */
export function isDuplicate(text: string, used: string[]): boolean {
  const n = normalize(text);
  return used.some((u) => {
    const m = normalize(u);
    return m === n || (n.length > 12 && m.includes(n)) || (m.length > 12 && n.includes(m));
  });
}

/** 제목·요약에서 수치/기관·종목/용어를 뽑아 사실 나열형 문장을 만든다. 근거가 없으면 null */
export function extractFacts(text: string, exclude: string): string | null {
  const unique = (arr: string[]) => Array.from(new Set(arr));
  const figures = unique((text.match(FIGURE) ?? []).map((f) => f.replace(/\s+/g, " ").trim())).slice(0, 4);
  const orgs = unique(ORGANIZATIONS.filter((o) => text.includes(o))).slice(0, 3);
  const terms = unique(glossaryTerms.map((t) => t.term).filter((t) => text.includes(t))).slice(0, 3);

  const parts: string[] = [];
  if (figures.length) parts.push(`언급된 수치: ${figures.join(", ")}`);
  if (orgs.length) parts.push(`관련 기관·종목: ${orgs.join(", ")}`);
  if (terms.length) parts.push(`관련 금융 용어: ${terms.join(", ")}`);
  if (parts.length === 0) return null;

  const sentence = parts.join(" / ");
  return normalize(sentence) === normalize(exclude) ? null : sentence;
}

/**
 * 기사 → 카드뉴스(요약 1 + 핵심 포인트 최대 3).
 * 기사에서 실제로 뽑아낸 텍스트만 쓰며, 재료가 부족하면 슬라이드 수를 줄인다.
 */
export function toCard(a: Article, category: NewsCategory, index: number): NewsItem {
  const fullText = `${a.title} ${a.description}`;

  // "(서울=연합뉴스) 홍길동 기자 = " 같은 기사 머리말 제거
  const body = a.description.replace(/^\([^)]*\)\s*[^=]{0,30}=\s*/, "");
  // RSS 요약은 글자 수로 잘려 오는 경우가 있어, 마침표로 끝난 완결 문장만 쓴다.
  const sentences = splitSentences(body).filter(isCompleteSentence);

  // 말머리·꼬리말 태그를 뗀 제목: 카드 제목과 fallback 요약에 함께 쓴다.
  const fallback = stripEditorMarks(a.title) || a.title;
  const summary =
    buildSummary(sentences) ?? toSummarySentence(pickFragment(body) ?? fallback);
  // 제목과 같은 내용의 포인트가 들어가지 않도록 제목도 사용된 문장으로 취급한다.
  const used = [summary, stripEditorMarks(a.title)];
  const points: string[] = [];
  const add = (text: string | null | undefined) => {
    if (!text || points.length >= 3 || isDuplicate(text, used)) return;
    points.push(text);
    used.push(text);
  };

  // 포인트 1: 제목의 핵심 사실을 개조식으로 (요약이 곧 제목인 경우 중복이라 건너뜀)
  if (sentences.length > 0) add(titleToBullet(a.title));

  // 포인트 2: RSS 요약의 나머지 핵심 문장 (요약에 쓰인 문장은 중복 검사로 걸러진다)
  sentences.slice(1, 4).forEach(add);

  // 포인트 3: 수치·기관·금융 용어 등 기사에 실제 언급된 지표
  add(extractFacts(fullText, summary));

  const terms = glossaryTerms
    .filter((t) => fullText.includes(t.term))
    .map((t) => t.term)
    .slice(0, 3);

  const kst = new Date(a.published + KST_OFFSET).toISOString();
  return {
    id: `rss-${index}`,
    category,
    headline: fallback,
    summary,
    points,
    terms,
    source: a.source,
    url: a.link,
    publishedAt: `${kst.slice(0, 10)} ${kst.slice(11, 16)}`,
  };
}
