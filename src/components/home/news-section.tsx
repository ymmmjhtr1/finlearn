"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TermText } from "@/components/glossary/term-text";
import { useTerms } from "@/components/glossary/term-provider";
import { findMentioned } from "@/lib/glossary-match";
import { newsCategories } from "@/data/news";
import type { NewsCategory, NewsItem } from "@/types/news";

function NewsCard({ item }: { item: NewsItem }) {
  const { openTerm, pattern } = useTerms();
  // 서버가 찾은 용어 + 사용자가 추가한 용어까지 포함해 기사에서 다시 찾는다.
  const tags = useMemo(
    () =>
      Array.from(new Set([...item.terms, ...findMentioned(`${item.headline} ${item.summary} ${item.points.join(" ")}`, pattern)])).slice(0, 5),
    [item, pattern]
  );
  // 슬라이드 0: 요약, 1~n: 핵심 포인트
  const [slide, setSlide] = useState(0);
  const slides = [
    { label: "한눈에 보기", text: item.summary },
    ...item.points.map((text, i) => ({ label: `핵심 포인트 ${i + 1}`, text })),
  ];
  const total = slides.length;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {item.publishedAt}
        </span>
        <CardTitle className="text-base leading-snug">
          <TermText text={item.headline} />
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4">
        <div className="overflow-hidden rounded-lg bg-accent text-accent-foreground">
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${slide * 100}%)` }}
          >
            {slides.map((s, i) => (
              <div
                key={i}
                aria-hidden={i !== slide}
                className="flex min-h-[132px] w-full shrink-0 flex-col gap-2 p-4 text-sm"
              >
                <div className="flex items-center justify-between">
                  <Badge>{item.category}</Badge>
                  <span className="text-xs font-semibold tabular-nums text-primary">
                    {i + 1} / {total}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-xs font-semibold text-primary">
                    {s.label}
                  </span>
                  <TermText text={s.text} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {total > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="이전 카드"
            onClick={() => setSlide((s) => (s - 1 + total) % total)}
          >
            <ChevronLeft />
          </Button>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번째 카드로 이동`}
                aria-current={i === slide}
                onClick={() => setSlide(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === slide ? "w-5 bg-primary" : "w-2 bg-border hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="다음 카드"
            onClick={() => setSlide((s) => (s + 1) % total)}
          >
            <ChevronRight />
          </Button>
        </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
          <span className="text-xs text-muted-foreground">관련 용어</span>
          {tags.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => openTerm(term)}
              className="cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-accent hover:underline"
            >
              {term}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          출처: {item.source}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-0.5 text-primary hover:underline"
            >
              원문 보기 <ExternalLink className="size-3" />
            </a>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function NewsCardSkeleton() {
  return (
    <Card className="flex h-full animate-pulse flex-col" aria-hidden>
      <CardHeader className="gap-3">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4">
        <div className="h-[132px] rounded-lg bg-muted" />
        <div className="h-8 rounded bg-muted" />
        <div className="h-6 w-1/2 rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

export function NewsSection() {
  const { pattern, markSeen } = useTerms();
  const [category, setCategory] = useState<NewsCategory | "전체">("전체");
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [range, setRange] = useState<"yesterday" | "48h">("yesterday");
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setItems(null);
    setError(false);
    try {
      const res = await fetch("/api/news", { signal });
      if (!res.ok) throw new Error(String(res.status));
      const data: { range: "yesterday" | "48h"; items: NewsItem[] } = await res.json();
      setItems(data.items);
      setRange(data.range);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // 기사에 등장한 용어의 마지막 등장 날짜를 용어사전에 기록한다. (용어는 영구 보존되므로 내일 뉴스에 없어도 사전에 남는다)
  useEffect(() => {
    if (!items) return;
    const seen: Record<string, string> = {};
    for (const item of items) {
      const date = item.publishedAt.slice(0, 10);
      for (const name of findMentioned(`${item.headline} ${item.summary} ${item.points.join(" ")}`, pattern)) {
        if (!seen[name] || seen[name] < date) seen[name] = date;
      }
    }
    markSeen(seen);
  }, [items, pattern, markSeen]);

  const filtered =
    category === "전체" || !items ? items : items.filter((n) => n.category === category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {(["전체", ...newsCategories] as const).map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
        {items && (
          <span className="ml-auto text-xs text-muted-foreground">
            {range === "yesterday" ? "어제 발행 기사" : "최근 48시간 기사 (어제 기사가 적어 확대)"}
          </span>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <p>뉴스를 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={() => load()}>
            다시 시도
          </Button>
        </div>
      ) : (
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          aria-busy={filtered === null}
        >
          {filtered === null
            ? Array.from({ length: 6 }, (_, i) => <NewsCardSkeleton key={i} />)
            : filtered.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
          {filtered?.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">
              해당 카테고리의 기사가 없어요.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
