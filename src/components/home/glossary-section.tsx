"use client";

import { useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTerms } from "@/components/glossary/term-provider";
import { GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/data/mock";

type SortKey = "ko" | "en";

interface GlossarySectionProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function GlossarySection({ query, onQueryChange }: GlossarySectionProps) {
  const { openTerm, terms, requestDelete, requestEdit } = useTerms();
  const [category, setCategory] = useState<GlossaryCategory | "전체">("전체");
  const [sort, setSort] = useState<SortKey>("ko");
  const [recentOnly, setRecentOnly] = useState(false);
  const keyword = query.trim().toLowerCase();

  // 용어가 하나라도 있는 카테고리만 필터에 보여준다 (기본 4개 + 사용자가 추가한 카테고리)
  const categories = ["전체", ...GLOSSARY_CATEGORIES.filter((c) => terms.some((t) => t.category === c))] as const;

  const matched = terms.filter(
    (t) =>
      (category === "전체" || t.category === category) &&
      (!recentOnly || t.lastSeenDate) &&
      (!keyword ||
        t.term.toLowerCase().includes(keyword) ||
        t.english.toLowerCase().includes(keyword) ||
        t.definition.toLowerCase().includes(keyword) ||
        t.example.toLowerCase().includes(keyword))
  );
  // 사용자가 추가한 용어는 항상 목록 맨 위(최신순), 나머지는 선택한 정렬 기준
  const results = [
    ...matched.filter((t) => t.custom),
    ...matched
      .filter((t) => !t.custom)
      .sort((a, b) =>
        sort === "ko"
          ? a.term.localeCompare(b.term, "ko")
          : (a.english || a.term).localeCompare(b.english || b.term, "en", { sensitivity: "base" })
      ),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="용어를 검색해 보세요 (예: 금리, ETF, Dividend, 직접 추가한 용어)"
          className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="카테고리 필터">
          {categories.map((c) => (
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
        <div className="flex items-center gap-1.5" role="group" aria-label="정렬">
          <Button
            size="sm"
            variant={recentOnly ? "default" : "outline"}
            aria-pressed={recentOnly}
            onClick={() => setRecentOnly((v) => !v)}
          >
            최근 뉴스 등장
          </Button>
          <Button
            size="sm"
            variant={sort === "ko" ? "secondary" : "ghost"}
            onClick={() => setSort("ko")}
          >
            가나다순
          </Button>
          <Button
            size="sm"
            variant={sort === "en" ? "secondary" : "ghost"}
            onClick={() => setSort("en")}
          >
            ABC순
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{results.length}개의 용어</p>

      {results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          조건에 맞는 용어가 없어요.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((t) => (
            <Card
              key={t.term}
              role="button"
              tabIndex={0}
              onClick={() => openTerm(t.term)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return; // 카드 안의 삭제 버튼 키 입력은 무시
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openTerm(t.term);
                }
              }}
              className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t.term}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    {t.custom && (
                      <>
                        <Badge variant="secondary">내가 추가</Badge>
                        <button
                          type="button"
                          aria-label={`${t.term} 수정`}
                          title="수정"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestEdit(t);
                          }}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${t.term} 삭제`}
                          title="삭제"
                          onClick={(e) => {
                            e.stopPropagation(); // 카드 클릭(상세 모달)과 분리
                            requestDelete(t);
                          }}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                    <Badge variant="outline">{t.category}</Badge>
                  </div>
                </div>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t.english}
                  {t.lastSeenDate && (
                    <span className="rounded bg-accent px-1.5 py-0.5 font-medium text-primary">
                      뉴스 등장 {t.lastSeenDate.slice(5).replace("-", "/")}
                    </span>
                  )}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p>{t.definition}</p>
                {t.example && (
                  <p className="rounded-lg bg-accent p-3 text-accent-foreground">
                    <span className="mr-1 font-semibold">예시</span>
                    {t.example}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
