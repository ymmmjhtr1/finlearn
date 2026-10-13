"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTerms } from "@/components/glossary/term-provider";
import { courses } from "@/data/courses";

export function CourseCards() {
  const { openTerm } = useTerms();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {courses.map((c) => (
        <Card key={c.step} className="flex flex-col">
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between">
              <Badge>{c.step}단계</Badge>
              <c.icon className="size-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{c.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{c.description}</p>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col gap-4">
            <ol className="flex flex-col gap-1.5 text-sm">
              {c.lessons.map((l, i) => (
                <li key={l} className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {i + 1}
                  </span>
                  {l}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
              <span className="text-xs text-muted-foreground">핵심 용어</span>
              {c.terms.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => openTerm(t)}
                  className="cursor-pointer rounded-md border px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-accent hover:underline"
                >
                  {t}
                </button>
              ))}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={c.action.href}>
                {c.action.label}
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
