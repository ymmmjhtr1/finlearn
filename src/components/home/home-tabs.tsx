"use client";

import { useState } from "react";
import { BookOpen, LineChart, Newspaper, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlossarySection } from "@/components/home/glossary-section";
import { NewsSection } from "@/components/home/news-section";
import { PortfolioSection } from "@/components/home/portfolio-section";

type TabId = "news" | "glossary" | "portfolio";

const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "news", label: "카드뉴스", icon: Newspaper },
  { id: "glossary", label: "용어사전", icon: BookOpen },
  { id: "portfolio", label: "모의투자", icon: LineChart },
];

export function HomeTabs() {
  const [active, setActive] = useState<TabId>("news");
  const [query, setQuery] = useState("");

  function openGlossary(term: string) {
    setQuery(term);
    setActive("glossary");
  }

  return (
    <section id="features" className="container pb-20">
      <div
        role="tablist"
        aria-label="주요 기능"
        className="mb-8 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active === t.id
                ? "bg-background text-primary shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`}>
        {active === "news" && <NewsSection onTermClick={openGlossary} />}
        {active === "glossary" && (
          <GlossarySection query={query} onQueryChange={setQuery} />
        )}
        {active === "portfolio" && <PortfolioSection />}
      </div>
    </section>
  );
}
