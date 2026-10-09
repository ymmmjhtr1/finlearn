import type { Metadata } from "next";

import { CourseCards } from "@/components/learn/course-cards";
import { DailyQuiz } from "@/components/learn/daily-quiz";

export const metadata: Metadata = { title: "학습" };

export default function LearnPage() {
  return (
    <div className="container flex flex-col gap-10 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">금융 학습 센터</h1>
        <p className="text-muted-foreground">
          3단계 코스로 금융 기초를 차근차근 쌓고, 퀴즈로 복습하며 모의투자 시드머니도 받아 가세요.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">단계별 학습 코스</h2>
        <CourseCards />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">오늘의 퀴즈</h2>
        <DailyQuiz />
      </section>
    </div>
  );
}
