import { XMLParser } from "fast-xml-parser";
import { NextResponse } from "next/server";

import { glossaryTerms } from "@/data/glossary";
import { stocks } from "@/data/stocks";
import type { NewsCategory, NewsItem } from "@/types/news";

export const dynamic = "force-dynamic";

// API 키가 필요 없는 경제지/통신사 RSS (매일경제 RSS는 봇 차단으로 제외)
const FEEDS = [
  { source: "연합뉴스 경제", url: "https://www.yna.co.kr/rss/economy.xml" },
  { source: "연합뉴스 마켓+", url: "https://www.yna.co.kr/rss/market.xml" },
  { source: "한국경제", url: "https://www.hankyung.com/feed/economy" },
  { source: "한국경제 증권", url: "https://www.hankyung.com/feed/finance" },
];

const CACHE_MS = 10 * 60_000;
const MAX_ITEMS = 9;
const MIN_YESTERDAY = 3;
const HOUR = 3_600_000;
const KST_OFFSET = 9 * HOUR;

interface Article {
  title: string;
  description: string;
  link: string;
  source: string;
  published: number;
}

interface NewsResponse {
  range: "yesterday" | "48h";
  items: NewsItem[];
}

// 모듈 레벨 메모리 캐시. force-dynamic에서는 fetch의 revalidate가 적용되지 않으므로 직접 관리한다.
let cache: { at: number; data: NewsResponse } | null = null;

const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });

function toText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

const ENTITIES: Record<string, string> = {
  quot: '"',
  apos: "'",
  amp: "&",
  lt: "<",
  gt: ">",
  nbsp: " ",
  hellip: "…",
  middot: "·",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
};

function decodeEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return ENTITIES[name.toLowerCase()] ?? m;
  });
}

/** HTML 태그·엔티티·제로폭 문자를 제거하고 공백을 정리한다. */
function clean(html: string): string {
  let text = html;
  // &amp;quot; 처럼 두 번 인코딩된 경우까지 풀리도록 최대 3회 반복
  for (let i = 0; i < 3; i++) {
    const next = decodeEntities(text).replace(/<[^>]*>/g, " ");
    if (next === text) break;
    text = next;
  }
  return text
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<Article[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (finlearn RSS reader)" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${feed.source} ${res.status}`);
  const xml = await res.text();
  const raw = parser.parse(xml)?.rss?.channel?.item;
  const items: Record<string, unknown>[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return items.flatMap((it) => {
    const published = Date.parse(toText(it.pubDate));
    const title = clean(toText(it.title));
    if (!title || Number.isNaN(published)) return [];
    return [
      {
        title,
        description: clean(toText(it.description)),
        link: toText(it.link),
        source: feed.source,
        published,
      },
    ];
  });
}

function categorize(text: string): NewsCategory {
  if (/환율|원\/달러|달러|엔화|외환/.test(text)) return "환율";
  if (/금리|국채|연준|기준금리|한국은행|한은|채권/.test(text)) return "금리";
  if (/코스피|코스닥|증시|지수|ETF|주가|투자자|거래소/.test(text)) return "시장";
  return "기업";
}

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
function stripEditorMarks(title: string): string {
  return title
    .replace(/\s*\((?:종합|상보|속보|\d+보|종합\d*보?|재송|수정)[^)]*\)\s*$/g, "")
    .replace(/^\s*\[(?:속보|단독|사진|영상|특징주|마감|종합)[^\]]*\]\s*/, "")
    .trim();
}

/** 제목을 쉼표·말줄임표·가운뎃점 기준으로 나눠 간결한 개조식 문장으로 재구성 */
function titleToBullet(title: string): string {
  const fragments = stripEditorMarks(title)
    .replace(/["“”'‘’]/g, "")
    .split(/\s*(?:…|\.{2,}|,|·|ㆍ|—|–)\s*/)
    .map((f) => f.trim())
    .filter((f) => f.length >= 2);
  return fragments.join(" · ");
}

/** 문장 단위 분리: 마침표/물음표/느낌표 뒤 공백, 줄바꿈 기준 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.replace(/[^가-힣A-Za-z0-9]/g, "").length >= 8);
}

const normalize = (s: string) => s.replace(/[^가-힣A-Za-z0-9]/g, "");

/** 이미 나온 문장과 사실상 같은 내용이면 true */
function isDuplicate(text: string, used: string[]): boolean {
  const n = normalize(text);
  return used.some((u) => {
    const m = normalize(u);
    return m === n || (n.length > 12 && m.includes(n)) || (m.length > 12 && n.includes(m));
  });
}

/** 제목·요약에서 수치/기관·종목/용어를 뽑아 사실 나열형 문장을 만든다. 근거가 없으면 null */
function extractFacts(text: string, exclude: string): string | null {
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
function toCard(a: Article, index: number): NewsItem {
  const fullText = `${a.title} ${a.description}`;
  const category = categorize(fullText);

  // "(서울=연합뉴스) 홍길동 기자 = " 같은 기사 머리말 제거
  const body = a.description.replace(/^\([^)]*\)\s*[^=]{0,30}=\s*/, "");
  const sentences = splitSentences(body);

  // 원문이 이미 "..." 또는 "…"로 끝나는 경우에만 말줄임표를 "…"로 통일한다.
  const summary = (sentences[0] ?? stripEditorMarks(a.title)).replace(/s*(?:.{3}|…)$/, "…");
  const used = [summary];
  const points: string[] = [];
  const add = (text: string | null | undefined) => {
    if (!text || points.length >= 3 || isDuplicate(text, used)) return;
    points.push(text);
    used.push(text);
  };

  // 포인트 1: 제목의 핵심 사실을 개조식으로 (요약이 곧 제목인 경우 중복이라 건너뜀)
  if (sentences.length > 0) add(titleToBullet(a.title));

  // 포인트 2: RSS 요약의 나머지 핵심 문장. 한 문장뿐이면 쉼표 뒤 서술부를 따로 보여준다.
  if (sentences.length > 1) {
    sentences.slice(1, 3).forEach(add);
  } else if (sentences.length === 1) {
    const clauses = sentences[0].split(/,\s*/);
    const tail = clauses.length > 1 ? clauses.slice(1).join(", ").trim() : "";
    if (tail.replace(/[^가-힣A-Za-z0-9]/g, "").length >= 10) add(tail);
  }

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
    headline: a.title,
    summary,
    points,
    terms,
    source: a.source,
    url: a.link,
    publishedAt: `${kst.slice(0, 10)} ${kst.slice(11, 16)}`,
  };
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const articles = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (articles.length === 0) {
    // 외부 장애 시 오래된 캐시라도 있으면 그것을 돌려준다.
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "뉴스를 불러오지 못했어요." }, { status: 502 });
  }

  // 한국 시간(KST) 기준 어제 00:00 ~ 23:59:59
  const now = Date.now();
  const todayStart = Math.floor((now + KST_OFFSET) / (24 * HOUR)) * 24 * HOUR - KST_OFFSET;
  const yesterdayStart = todayStart - 24 * HOUR;

  const inYesterday = articles.filter(
    (a) => a.published >= yesterdayStart && a.published < todayStart
  );
  // 주말 등으로 어제 기사가 적으면 최근 48시간으로 폴백
  const useFallback = inYesterday.length < MIN_YESTERDAY;
  const pool = useFallback
    ? articles.filter((a) => a.published >= now - 48 * HOUR && a.published <= now)
    : inYesterday;

  const seen = new Set<string>();
  const picked = pool
    .filter((a) => {
      // 제목이 같거나, 같은 보도의 제목만 바뀐 기사(요약 앞부분 동일)는 한 번만 싣는다.
      const keys = [a.title.replace(/\s/g, "")];
      if (a.description) keys.push(normalize(a.description).slice(0, 40));
      if (keys.some((k) => seen.has(k))) return false;
      keys.forEach((k) => seen.add(k));
      return true;
    })
    // 요약이 있는 기사를 우선, 그 안에서는 최신순
    .sort(
      (x, y) =>
        Number(!!y.description) - Number(!!x.description) || y.published - x.published
    )
    .slice(0, MAX_ITEMS);

  const data: NewsResponse = {
    range: useFallback ? "48h" : "yesterday",
    items: picked.map(toCard),
  };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
