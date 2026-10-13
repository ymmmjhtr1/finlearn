import { Globe2, LineChart, PiggyBank } from "lucide-react";

import type { Course } from "@/types/course";

export const courses: Course[] = [
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
