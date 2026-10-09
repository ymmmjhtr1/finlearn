"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Coins, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { depositReward } from "@/lib/portfolio-storage";

const REWARD = 500_000;
const QUIZ_KEY = "finlearn:quiz:v1";

interface Question {
  id: string;
  kind: "OX" | "객관식";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: "q1",
    kind: "OX",
    question: "한국은행이 기준금리를 올리면, 일반적으로 대출 이자 부담은 커진다.",
    options: ["O", "X"],
    answer: 0,
    explanation:
      "기준금리는 시중 금리의 출발점이라서, 기준금리가 오르면 은행 대출 금리도 함께 오르는 경향이 있어요.",
  },
  {
    id: "q2",
    kind: "객관식",
    question: "원/달러 환율이 1,300원에서 1,400원으로 올랐어요. 원화 가치는 어떻게 된 걸까요?",
    options: ["올랐다 (강세)", "내렸다 (약세)", "변화 없다"],
    answer: 1,
    explanation:
      "1달러를 사는 데 더 많은 원화가 필요해졌다는 뜻이므로, 달러 대비 원화 가치는 내려간 거예요.",
  },
  {
    id: "q3",
    kind: "객관식",
    question: "'계란을 한 바구니에 담지 말라'는 격언과 가장 관련 깊은 투자 원칙은?",
    options: ["손절매", "분산투자", "복리 효과", "어닝 서프라이즈"],
    answer: 1,
    explanation:
      "여러 종목·자산에 나눠 투자하면 한쪽이 무너져도 전체 손실을 줄일 수 있어요. 이것이 분산투자예요.",
  },
];

interface QuizState {
  date: string;
  /** 문제 id → 고른 보기 번호 */
  answers: Record<string, number>;
}

const today = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function loadQuiz(): QuizState {
  const fresh: QuizState = { date: today(), answers: {} };
  try {
    const raw = localStorage.getItem(QUIZ_KEY);
    if (!raw) return fresh;
    const d = JSON.parse(raw) as QuizState;
    // 날짜가 바뀌면 새 퀴즈로 초기화
    if (d?.date !== fresh.date || typeof d.answers !== "object" || !d.answers) return fresh;
    return d;
  } catch {
    return fresh;
  }
}

export function DailyQuiz() {
  const [state, setState] = useState<QuizState | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  // SSR과 맞추기 위해 마운트 후에만 localStorage를 읽는다.
  useEffect(() => {
    setState(loadQuiz());
  }, []);

  function choose(q: Question, choice: number) {
    if (!state || q.id in state.answers) return; // 하루 한 번만 응시
    const next: QuizState = { ...state, answers: { ...state.answers, [q.id]: choice } };
    setState(next);
    try {
      localStorage.setItem(QUIZ_KEY, JSON.stringify(next));
    } catch {
      // 저장 불가 시에도 이번 방문 동안은 동작
    }
    if (choice === q.answer && !depositReward(REWARD)) setSaveFailed(true);
  }

  const answered = state ? questions.filter((q) => q.id in state.answers) : [];
  const correct = state ? answered.filter((q) => state.answers[q.id] === q.answer) : [];
  const done = answered.length === questions.length;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>일일 금융 퀴즈</CardTitle>
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
            <Coins className="size-3.5" />
            정답 1개당 +{won(REWARD)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          정답을 맞히면 모의투자 가상 시드머니가 바로 입금돼요. 문제마다 하루에 한 번만 도전할 수 있어요.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!state ? (
          <div className="h-48 animate-pulse rounded-lg bg-muted" aria-busy />
        ) : (
          questions.map((q, qi) => {
            const picked = state.answers[q.id];
            const isAnswered = picked !== undefined;
            const isCorrect = picked === q.answer;
            return (
              <section key={q.id} className="flex flex-col gap-3">
                <h3 className="font-semibold">
                  <span className="mr-2 rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                    {q.kind}
                  </span>
                  Q{qi + 1}. {q.question}
                </h3>
                <div className={cn("grid gap-2", q.kind === "OX" ? "grid-cols-2" : "sm:grid-cols-2")}>
                  {q.options.map((opt, oi) => (
                    <Button
                      key={opt}
                      variant="outline"
                      disabled={isAnswered}
                      onClick={() => choose(q, oi)}
                      className={cn(
                        "h-auto justify-start whitespace-normal py-2.5 text-left disabled:opacity-100",
                        q.kind === "OX" && "justify-center text-lg font-bold",
                        isAnswered && oi === q.answer && "border-emerald-500 bg-emerald-50 text-emerald-900",
                        isAnswered && oi === picked && !isCorrect && "border-rose-400 bg-rose-50 text-rose-900"
                      )}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
                {isAnswered && (
                  <p
                    role="status"
                    className={cn(
                      "flex gap-2 rounded-lg p-3 text-sm",
                      isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
                    )}
                  >
                    {isCorrect ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
                    <span>
                      <strong>{isCorrect ? `정답! +${won(REWARD)} 입금 완료. ` : "아쉬워요, 오답이에요. "}</strong>
                      {q.explanation}
                    </span>
                  </p>
                )}
              </section>
            );
          })
        )}

        {state && done && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950">
            <div>
              <p className="font-bold">
                오늘의 퀴즈 완료! {questions.length}문제 중 {correct.length}문제 정답
              </p>
              <p className="text-sm">
                오늘 받은 보상 {won(correct.length * REWARD)}
                {saveFailed && " (브라우저 저장소를 쓸 수 없어 모의투자 잔고에는 반영되지 않았어요)"}
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/">모의투자 잔고 확인</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
