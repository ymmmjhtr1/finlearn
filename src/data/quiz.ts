import type { Question } from "@/types/quiz";

export const questions: Question[] = [
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
