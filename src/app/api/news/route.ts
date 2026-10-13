import { NextResponse } from "next/server";

import { HOUR, KST_OFFSET } from "@/lib/news/constants";
import { categorize, isRoundupTitle } from "@/lib/news/classify";
import { fetchFeed, FEEDS } from "@/lib/news/parse";
import { normalize, toCard } from "@/lib/news/summarize";
import type { NewsItem } from "@/types/news";

export const dynamic = "force-dynamic";

const CACHE_MS = 10 * 60_000;
const MAX_ITEMS = 9;
const MIN_YESTERDAY = 3;

interface NewsResponse {
  range: "yesterday" | "48h";
  items: NewsItem[];
}

// 모듈 레벨 메모리 캐시. force-dynamic에서는 fetch의 revalidate가 적용되지 않으므로 직접 관리한다.
let cache: { at: number; data: NewsResponse } | null = null;

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
    .flatMap((a) => {
      if (isRoundupTitle(a.title)) return [];
      const category = categorize(`${a.title} ${a.description}`);
      return category ? [{ a, category }] : [];
    })
    .filter(({ a }) => {
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
        Number(!!y.a.description) - Number(!!x.a.description) || y.a.published - x.a.published
    )
    .slice(0, MAX_ITEMS);

  const data: NewsResponse = {
    range: useFallback ? "48h" : "yesterday",
    items: picked.map(({ a, category }, i) => toCard(a, category, i)),
  };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
