import { XMLParser } from "fast-xml-parser";

// API 키가 필요 없는 경제지/통신사 RSS (매일경제 RSS는 봇 차단으로 제외)
export const FEEDS = [
  { source: "연합뉴스 경제", url: "https://www.yna.co.kr/rss/economy.xml" },
  { source: "연합뉴스 마켓+", url: "https://www.yna.co.kr/rss/market.xml" },
  { source: "한국경제", url: "https://www.hankyung.com/feed/economy" },
  { source: "한국경제 증권", url: "https://www.hankyung.com/feed/finance" },
];

export interface Article {
  title: string;
  description: string;
  link: string;
  source: string;
  published: number;
}

const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });

export function toText(v: unknown): string {
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

export function decodeEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return ENTITIES[name.toLowerCase()] ?? m;
  });
}

/** HTML 태그·엔티티·제로폭 문자를 제거하고 공백을 정리한다. */
export function clean(html: string): string {
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

/** RSS XML 문자열을 기사 목록으로 변환한다. 제목이 없거나 발행일이 잘못된 항목은 버린다. */
export function parseFeedXml(xml: string, source: string): Article[] {
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
        source,
        published,
      },
    ];
  });
}

export async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<Article[]> {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (finlearn RSS reader)" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${feed.source} ${res.status}`);
  return parseFeedXml(await res.text(), feed.source);
}
