"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { newsCategories, newsItems, type NewsCategory } from "@/data/mock";

interface NewsSectionProps {
  onTermClick: (term: string) => void;
}

function NewsCard({
  item,
  onTermClick,
}: {
  item: (typeof newsItems)[number];
  onTermClick: (term: string) => void;
}) {
  // 슬라이드 0: 요약, 1~n: 핵심 포인트
  const [slide, setSlide] = useState(0);
  const total = item.points.length + 1;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{item.category}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {item.publishedAt}
          </span>
        </div>
        <CardTitle className="text-base leading-snug">{item.headline}</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4">
        <div className="min-h-[88px] rounded-lg bg-accent p-4 text-sm text-accent-foreground">
          {slide === 0 ? (
            item.summary
          ) : (
            <>
              <span className="mb-1 block text-xs font-semibold text-primary">
                핵심 포인트 {slide}
              </span>
              {item.points[slide - 1]}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="이전 카드"
            disabled={slide === 0}
            onClick={() => setSlide((s) => s - 1)}
          >
            <ChevronLeft />
          </Button>
          <div className="flex gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full",
                  i === slide ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="다음 카드"
            disabled={slide === total - 1}
            onClick={() => setSlide((s) => s + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
          <span className="text-xs text-muted-foreground">관련 용어</span>
          {item.terms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onTermClick(term)}
              className="rounded-md border px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
            >
              {term}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">출처: {item.source} (더미 데이터)</p>
      </CardContent>
    </Card>
  );
}

export function NewsSection({ onTermClick }: NewsSectionProps) {
  const [category, setCategory] = useState<NewsCategory | "전체">("전체");
  const filtered =
    category === "전체"
      ? newsItems
      : newsItems.filter((n) => n.category === category);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
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
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <NewsCard key={item.id} item={item} onTermClick={onTermClick} />
        ))}
      </div>
    </div>
  );
}
