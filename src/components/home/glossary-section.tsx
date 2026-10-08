"use client";

import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { glossaryTerms } from "@/data/mock";

interface GlossarySectionProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export function GlossarySection({ query, onQueryChange }: GlossarySectionProps) {
  const keyword = query.trim().toLowerCase();
  const results = glossaryTerms
    .filter(
      (t) =>
        !keyword ||
        t.term.toLowerCase().includes(keyword) ||
        t.english.toLowerCase().includes(keyword) ||
        t.definition.includes(keyword)
    )
    .sort((a, b) => a.term.localeCompare(b.term, "ko"));

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="용어를 검색해 보세요 (예: 금리, ETF, Dividend)"
          className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {results.length}개의 용어
      </p>

      {results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          &lsquo;{query}&rsquo;에 해당하는 용어가 없어요.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((t) => (
            <Card key={t.term}>
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t.term}</CardTitle>
                  <Badge variant="outline">{t.category}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{t.english}</span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p>{t.definition}</p>
                <p className="rounded-lg bg-accent p-3 text-accent-foreground">
                  <span className="mr-1 font-semibold">예시</span>
                  {t.example}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
