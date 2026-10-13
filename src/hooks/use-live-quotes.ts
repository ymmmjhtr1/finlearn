"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { stocks } from "@/data/stocks";
import type { LiveStock, Quote, StocksResponse } from "@/types/stock";

/** /api/stocks 시세를 마운트 시 조회하고, 수동 새로고침을 제공한다. */
export function useLiveQuotes() {
  const [quotes, setQuotes] = useState<Record<string, Quote> | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/stocks", { signal });
      if (!res.ok) throw new Error(String(res.status));
      const data: StocksResponse = await res.json();
      setQuotes(data.quotes);
      setFetchedAt(data.fetchedAt);
      setError(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const liveStocks: LiveStock[] = useMemo(
    () => stocks.flatMap((s) => (quotes?.[s.code] ? [{ ...s, ...quotes[s.code] }] : [])),
    [quotes]
  );
  const liveByCode = useMemo(
    () => Object.fromEntries(liveStocks.map((s) => [s.code, s])) as Record<string, LiveStock>,
    [liveStocks]
  );

  return { quotes, fetchedAt, error, refreshing, refresh, liveStocks, liveByCode };
}
