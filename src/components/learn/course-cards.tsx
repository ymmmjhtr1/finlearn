"use client";

import Link from "next/link";
import { ArrowRight, Globe2, LineChart, PiggyBank, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTerms } from "@/components/glossary/term-provider";

interface Course {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  lessons: string[];
  /** 용어사전에 있는 용어 이름 */
  terms: string[];
  action: { label: string; href: string };
}

const courses: Course[] = [
  {
    step: 1,
    title: "예적금과 금리의 원리",
    description: "돈에 이자가 붙는 방식과 금리가 움직이는 이유를 배워요.",
    icon: PiggyBank,
    lessons: [
      "예금과 적금, 무엇이 다를까?",
      "단리와 복리 — 시간이 만드는 차이",
      "기준금리가 내 대출과 예금에 미치는 영향",
      "이자소득세 15.4%는 어떻게 계산될까?",
    ],
    terms: ["기준금리", "복리", "인플레이션"],
    action: { label: "복리·예적금 계산기 써보기", href: "/tools" },
  },
  {
    step: 2,
    title: "주식과 재무제표 읽기",
    description: "주식의 기본 개념과 기업의 성적표를 읽는 법을 익혀요.",
    icon: LineChart,
    lessons: [
      "주식과 ETF, 어떻게 다를까?",
      "매출·영업이익·순이익 한눈에 보기",
      "PER로 주가가 비싼지 가늠하기",
      "분산투자와 손절매 원칙",
    ],
    terms: ["영업이익", "PER", "ETF", "분산투자"],
    action: { label: "모의투자로 연습하기", href: "/" },
  },
  {
    step: 3,
    title: "거시경제 지표와 환율",
    description: "뉴스에 자주 나오는 경제 지표가 내 지갑에 미치는 영향을 알아봐요.",
    icon: Globe2,
    lessons: [
      "환율이 오르면 누가 웃고 누가 울까?",
      "연준과 한국은행의 금리 결정",
      "국채금리는 왜 중요한 신호일까?",
      "물가(인플레이션)와 내 월급의 가치",
    ],
    terms: ["환율", "연준", "국채", "코스피"],
    action: { label: "오늘의 카드뉴스 보기", href: "/" },
  },
];

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
