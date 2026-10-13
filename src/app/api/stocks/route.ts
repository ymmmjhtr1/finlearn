import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

import { stocks } from "@/data/stocks";
import type { PricePoint, Quote, StocksResponse } from "@/types/stock";

export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const HISTORY_DAYS = 30;
// 외부 API에 한꺼번에 몰리지 않도록 일봉 조회는 이 개수씩 나눠서 병렬 실행한다.
const CHUNK_SIZE = 5;
const CACHE_MS = 60_000;
const DAY = 86_400_000;

// validateResult: false 이면 라이브러리가 타입을 주지 않으므로 쓰는 필드만 직접 선언한다.
interface RawQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: Date;
  marketState?: string;
}
interface RawChart {
  quotes: { date: Date; close?: number | null }[];
}

let cache: { at: number; data: StocksResponse } | null = null;

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

async function fetchHistory(ticker: string): Promise<PricePoint[]> {
  // 휴장일을 감안해 넉넉히 60일을 받아 최근 30개 거래일만 쓴다.
  const result = (await yahooFinance.chart(
    ticker,
    { period1: new Date(Date.now() - 60 * DAY), interval: "1d" },
    { validateResult: false }
  )) as RawChart;
  return result.quotes
    .filter((q) => finite(q.close))
    .slice(-HISTORY_DAYS)
    .map((q) => {
      // 일봉 날짜는 한국 장 기준이므로 KST로 환산해 라벨을 만든다.
      const kst = new Date(q.date.getTime() + 9 * 3_600_000).toISOString();
      return { label: `${kst.slice(5, 7)}/${kst.slice(8, 10)}`, price: q.close as number };
    });
}

/** 작업을 CHUNK_SIZE개씩 병렬 실행하고, 실패한 항목은 건너뛰도록 allSettled 결과로 돌려준다. */
async function settleInChunks<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    results.push(...(await Promise.allSettled(chunk.map(worker))));
  }
  return results;
}

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  // 시세(현재가·등락)는 한 번에, 일봉은 종목별로 병렬 조회. 일부가 실패해도 나머지는 반환한다.
  const [quoteResult, historyResults] = await Promise.all([
    Promise.allSettled([
      yahooFinance.quote(stocks.map((s) => s.ticker), {}, { validateResult: false }) as Promise<
        RawQuote[]
      >,
    ]).then((r) => r[0]),
    settleInChunks(stocks, (s) => fetchHistory(s.ticker)),
  ]);

  const quoteBySymbol = new Map(
    quoteResult.status === "fulfilled" ? quoteResult.value.map((q) => [q.symbol, q]) : []
  );

  const quotes: Record<string, Quote> = {};
  stocks.forEach((s, i) => {
    const q = quoteBySymbol.get(s.ticker);
    const h = historyResults[i];
    const history = h.status === "fulfilled" ? h.value : [];

    // 장 마감·주말·공휴일에는 regularMarketPrice가 직전 거래일 종가이고, 비어 있으면 마지막 일봉 종가로 대체한다.
    const last = history[history.length - 1]?.price;
    const prev = history[history.length - 2]?.price;
    const price = finite(q?.regularMarketPrice) ? q.regularMarketPrice : last;
    if (!finite(price)) return; // 시세를 전혀 얻지 못한 종목은 제외

    const change = finite(q?.regularMarketChange)
      ? q.regularMarketChange
      : finite(prev)
        ? price - prev
        : 0;
    const changeRate = finite(q?.regularMarketChangePercent)
      ? q.regularMarketChangePercent
      : finite(prev) && prev !== 0
        ? ((price - prev) / prev) * 100
        : 0;

    const time = q?.regularMarketTime;
    quotes[s.code] = {
      price,
      change,
      changeRate,
      marketState: q?.marketState ?? "CLOSED",
      asOf: (time instanceof Date ? time : new Date()).toISOString(),
      history,
    };
  });

  if (Object.keys(quotes).length === 0) {
    // 외부 장애 시 오래된 캐시라도 있으면 그것을 돌려준다.
    if (cache) return NextResponse.json(cache.data);
    return NextResponse.json({ error: "시세를 불러오지 못했어요." }, { status: 502 });
  }

  const data: StocksResponse = { fetchedAt: new Date().toISOString(), quotes };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
