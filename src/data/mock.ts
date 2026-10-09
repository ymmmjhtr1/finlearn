export type NewsCategory = "시장" | "금리" | "기업" | "환율";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  points: string[];
  terms: string[];
  source: string;
  url?: string;
  publishedAt: string;
}

export const newsCategories: NewsCategory[] = ["시장", "금리", "기업", "환율"];

export const newsItems: NewsItem[] = [
  {
    id: "n1",
    category: "금리",
    headline: "한국은행, 기준금리 연 2.50% 동결…\"물가·가계부채 지켜본다\"",
    summary: "금융통화위원회가 기준금리를 5회 연속 동결했습니다.",
    points: [
      "기준금리는 은행 대출·예금 금리의 출발점이에요.",
      "동결은 '당분간 금리를 올리지도 내리지도 않겠다'는 뜻이에요.",
      "대출 이자 부담이 당장 크게 바뀌지는 않을 전망이에요.",
    ],
    terms: ["기준금리", "금융통화위원회"],
    source: "금융뉴스 데모",
    publishedAt: "2026-10-07 09:10",
  },
  {
    id: "n2",
    category: "시장",
    headline: "코스피, 외국인 순매수에 3,050선 회복…반도체주 강세",
    summary: "외국인이 5거래일 연속 순매수하며 지수를 끌어올렸습니다.",
    points: [
      "코스피는 한국 대표 기업 약 900여 개의 주가를 종합한 지수예요.",
      "외국인 순매수는 산 금액이 판 금액보다 많다는 뜻이에요.",
      "반도체 업종 비중이 커서 지수 영향이 큽니다.",
    ],
    terms: ["코스피", "순매수"],
    source: "금융뉴스 데모",
    publishedAt: "2026-10-07 15:40",
  },
  {
    id: "n3",
    category: "환율",
    headline: "원·달러 환율 1,360원대 안착…수입 물가 부담 완화",
    summary: "달러 약세 흐름에 원화 가치가 소폭 올랐습니다.",
    points: [
      "환율이 내리면 같은 달러를 더 적은 원화로 살 수 있어요.",
      "해외 직구·여행 비용과 수입 원자재 가격에 영향을 줘요.",
      "수출 기업에는 불리하게 작용할 수 있어요.",
    ],
    terms: ["환율"],
    source: "금융뉴스 데모",
    publishedAt: "2026-10-06 17:20",
  },
  {
    id: "n4",
    category: "기업",
    headline: "삼성전자, 3분기 영업이익 시장 전망치 상회 잠정 발표",
    summary: "메모리 가격 반등으로 실적이 예상보다 좋았습니다.",
    points: [
      "영업이익은 매출에서 본업 비용을 뺀 이익이에요.",
      "'어닝 서프라이즈'는 실적이 예상보다 좋을 때 쓰는 말이에요.",
      "실적 발표 전후로 주가가 크게 움직이기도 해요.",
    ],
    terms: ["영업이익", "어닝 서프라이즈"],
    source: "금융뉴스 데모",
    publishedAt: "2026-10-06 08:30",
  },
  {
    id: "n5",
    category: "시장",
    headline: "ETF 순자산 200조 돌파…개인 투자자 '분할 매수' 확산",
    summary: "적립식으로 ETF를 모으는 투자 방식이 대중화되고 있어요.",
    points: [
      "ETF는 여러 종목을 묶어 주식처럼 거래하는 펀드예요.",
      "분할 매수는 여러 번에 나눠 사서 매수 시점 위험을 줄이는 방법이에요.",
      "소액으로도 분산투자가 가능하다는 점이 장점이에요.",
    ],
    terms: ["ETF", "분산투자"],
    source: "금융뉴스 데모",
    publishedAt: "2026-10-05 11:00",
  },
  {
    id: "n6",
    category: "금리",
    headline: "미국 연준 위원들 \"추가 인하 서두르지 않겠다\"…국채금리 상승",
    summary: "미국 국채 10년물 금리가 4.2%대로 올랐습니다.",
    points: [
      "국채금리가 오르면 채권 가격은 떨어져요.",
      "미국 금리는 전 세계 자금 흐름에 영향을 줘요.",
      "금리가 높으면 성장주에는 부담이 될 수 있어요.",
    ],
    terms: ["국채", "연준"],
    source: "금융뉴스 데모",
    publishedAt: "2026-10-05 07:45",
  },
];

export const GLOSSARY_CATEGORIES = [
  "기초",
  "주식",
  "채권·금리",
  "투자상품",
  "거시경제",
  "금융상식",
] as const;
export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryTerm {
  term: string;
  english: string;
  category: GlossaryCategory;
  /** 난이도 */
  level: "기초" | "심화";
  definition: string;
  /** 비어 있을 수 있음(사용자가 추가한 용어) */
  example: string;
  /** 초보자용 일상 속 비유. 비어 있을 수 있음 */
  analogy: string;
  /** 사용자가 직접 추가한 용어 */
  custom?: boolean;
  /** 추가한 시각(ISO) — 사용자 추가 용어 */
  addedAt?: string;
  /** 카드뉴스에 마지막으로 등장한 기사 날짜(YYYY-MM-DD) */
  lastSeenDate?: string;
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "기준금리",
    english: "Base Rate",
    level: "기초",
    category: "채권·금리",
    definition: "중앙은행이 정하는 정책 금리로, 시중 모든 금리의 기준이 됩니다.",
    example: "기준금리가 내리면 대출 이자와 예금 이자가 함께 낮아지는 경향이 있어요.",
    analogy: "학교 매점 가격표의 '기준 단가'와 같아요. 기준이 바뀌면 가게들이 각자 가격을 따라 올리거나 내리죠.",
  },
  {
    term: "금융통화위원회",
    english: "Monetary Policy Board",
    level: "심화",
    category: "채권·금리",
    definition: "한국은행 안에서 기준금리를 결정하는 최고 의사결정 기구입니다.",
    example: "금통위는 보통 연 8회 열려 기준금리를 정해요.",
    analogy: "학급 회의에서 '이번 달 규칙'을 투표로 정하는 반장단과 비슷해요.",
  },
  {
    term: "코스피",
    english: "KOSPI",
    level: "기초",
    category: "주식",
    definition: "한국거래소 유가증권시장에 상장된 기업들의 주가를 종합한 지수입니다.",
    example: "코스피가 3,000이라는 것은 기준 시점(1980년 1월 4일=100)보다 30배 올랐다는 뜻이에요.",
    analogy: "반 전체 시험 평균 점수처럼, 대표 기업들의 성적표를 하나의 숫자로 요약한 거예요.",
  },
  {
    term: "순매수",
    english: "Net Buying",
    level: "기초",
    category: "주식",
    definition: "특정 기간 동안 매수 금액에서 매도 금액을 뺀 값이 플러스인 상태입니다.",
    example: "외국인 순매수 1,000억 원 = 외국인이 판 것보다 1,000억 원어치 더 샀다는 뜻이에요.",
    analogy: "장터에서 사간 사람이 판 사람보다 많으면 그날은 '사자' 분위기라고 말하는 것과 같아요.",
  },
  {
    term: "환율",
    english: "Exchange Rate",
    level: "기초",
    category: "기초",
    definition: "한 나라 돈과 다른 나라 돈을 바꿀 때의 교환 비율입니다.",
    example: "1달러 = 1,360원이면 미국 여행에서 100달러를 쓸 때 13만 6천 원이 필요해요.",
    analogy: "공항 환전소의 '오늘의 교환 비율표'예요. 해외 직구 때 결제 금액이 달라지는 이유죠.",
  },
  {
    term: "영업이익",
    english: "Operating Profit",
    level: "심화",
    category: "주식",
    definition: "매출액에서 매출원가와 판매관리비를 뺀, 본업으로 번 이익입니다.",
    example: "매출 100억, 원가·관리비 85억이면 영업이익은 15억 원이에요.",
    analogy: "치킨집 매출에서 닭값·직원 월급·임대료를 빼고 사장님 손에 남는 돈이에요.",
  },
  {
    term: "어닝 서프라이즈",
    english: "Earnings Surprise",
    level: "심화",
    category: "주식",
    definition: "기업의 실적이 시장 예상치를 크게 웃도는 것을 말합니다. 반대는 '어닝 쇼크'.",
    example: "예상 영업이익 8조 원, 실제 9조 원이면 어닝 서프라이즈예요.",
    analogy: "60점 예상했던 학생이 90점을 받아 모두가 깜짝 놀라는 상황이에요.",
  },
  {
    term: "ETF",
    english: "Exchange Traded Fund",
    level: "기초",
    category: "투자상품",
    definition: "지수나 자산 묶음을 추종하며 주식처럼 거래소에서 사고팔 수 있는 펀드입니다.",
    example: "KOSPI200 ETF 1주를 사면 코스피 대표 200개 기업에 한 번에 투자하는 효과가 있어요.",
    analogy: "과일 하나가 아니라 과일 바구니를 통째로 사는 것과 같아요. 한 번에 여러 종목을 담아요.",
  },
  {
    term: "분산투자",
    english: "Diversification",
    level: "기초",
    category: "기초",
    definition: "여러 종목·자산에 나눠 투자해 한쪽의 손실이 전체에 미치는 영향을 줄이는 전략입니다.",
    example: "주식 60%, 채권 30%, 현금 10%로 나눠 담는 식이에요.",
    analogy: "'계란을 한 바구니에 담지 말라'는 속담 그대로예요. 바구니 하나가 떨어져도 나머지는 안전해요.",
  },
  {
    term: "국채",
    english: "Government Bond",
    level: "기초",
    category: "채권·금리",
    definition: "정부가 돈을 빌리며 발행하는 채권으로, 가장 안전한 투자자산으로 꼽힙니다.",
    example: "미국 10년물 국채는 글로벌 금리의 기준처럼 쓰여요.",
    analogy: "나라에 돈을 빌려주고 이자를 받는 '나라와의 차용증'이에요. 나라가 망하지 않는 한 받을 수 있죠.",
  },
  {
    term: "연준",
    english: "Federal Reserve",
    level: "심화",
    category: "채권·금리",
    definition: "미국의 중앙은행(Fed). 미국 기준금리를 정하며 세계 금융시장에 큰 영향을 줍니다.",
    example: "연준이 금리를 올리면 달러가 강세가 되고 신흥국 증시는 흔들리기 쉬워요.",
    analogy: "세계 1위 경제대국의 '은행들의 은행'이에요. 여기서 하는 말 한마디에 전 세계 시장이 출렁여요.",
  },
  {
    term: "배당",
    english: "Dividend",
    level: "기초",
    category: "주식",
    definition: "기업이 이익의 일부를 주주에게 현금이나 주식으로 나눠주는 것입니다.",
    example: "주당 배당금 1,000원인 주식을 100주 가지면 10만 원을 받아요.",
    analogy: "같이 운영하는 동아리 가게의 수익을 지분대로 나눠 받는 용돈 같은 거예요.",
  },
  {
    term: "PER",
    english: "Price Earnings Ratio",
    level: "심화",
    category: "주식",
    definition: "주가를 주당순이익(EPS)으로 나눈 값으로, 이익 대비 주가가 비싼지 가늠하는 지표입니다.",
    example: "주가 10만 원, EPS 1만 원이면 PER은 10배예요.",
    analogy: "월 100만 원 버는 가게를 1,000만 원에 산다면 '10개월이면 본전'인 셈이에요. 숫자가 클수록 비싸게 산 거예요.",
  },
  {
    term: "인플레이션",
    english: "Inflation",
    level: "기초",
    category: "기초",
    definition: "물가가 지속적으로 오르면서 돈의 가치가 떨어지는 현상입니다.",
    example: "물가가 연 3% 오르면 올해 100만 원으로 살 물건이 내년엔 97만 원어치로 줄어요.",
    analogy: "예전엔 1,000원이던 과자가 지금은 1,500원인 것처럼 같은 돈으로 살 수 있는 게 줄어드는 현상이에요.",
  },
  {
    term: "복리",
    english: "Compound Interest",
    level: "기초",
    category: "기초",
    definition: "원금뿐 아니라 이미 붙은 이자에도 이자가 붙는 계산 방식입니다.",
    example: "100만 원을 연 5% 복리로 10년 굴리면 약 162만 9천 원이 돼요.",
    analogy: "눈덩이를 굴리면 굴릴수록 겉면에 눈이 더 많이 붙어 점점 커지는 것과 같아요.",
  },
  {
    term: "손절매",
    english: "Stop Loss",
    level: "기초",
    category: "투자상품",
    definition: "손실이 더 커지기 전에 미리 정한 기준에서 보유 종목을 팔아 손실을 확정하는 것입니다.",
    example: "매수가 대비 -10%에서 손절하기로 정해 두는 식이에요.",
    analogy: "상한 과일이 더 썩기 전에 일찌감치 버려서 나머지 과일을 지키는 것과 비슷해요.",
  },
];

export interface Stock {
  code: string;
  name: string;
  sector: string;
  /** Yahoo Finance 티커 */
  ticker: string;
}

export const stocks: Stock[] = [
  { code: "005930", name: "삼성전자", sector: "반도체/IT", ticker: "005930.KS" },
  { code: "000660", name: "SK하이닉스", sector: "반도체/IT", ticker: "000660.KS" },
  { code: "035420", name: "NAVER", sector: "플랫폼/인터넷", ticker: "035420.KS" },
  { code: "035720", name: "카카오", sector: "플랫폼/인터넷", ticker: "035720.KS" },
  { code: "373220", name: "LG에너지솔루션", sector: "2차전지", ticker: "373220.KS" },
  { code: "005490", name: "POSCO홀딩스", sector: "2차전지", ticker: "005490.KS" },
  { code: "247540", name: "에코프로비엠", sector: "2차전지", ticker: "247540.KQ" },
  { code: "005380", name: "현대차", sector: "자동차", ticker: "005380.KS" },
  { code: "000270", name: "기아", sector: "자동차", ticker: "000270.KS" },
  { code: "207940", name: "삼성바이오로직스", sector: "바이오", ticker: "207940.KS" },
  { code: "068270", name: "셀트리온", sector: "바이오", ticker: "068270.KS" },
  { code: "105560", name: "KB금융", sector: "금융", ticker: "105560.KS" },
  { code: "055550", name: "신한지주", sector: "금융", ticker: "055550.KS" },
  { code: "352820", name: "하이브", sector: "엔터/콘텐츠", ticker: "352820.KS" },
  { code: "069500", name: "KODEX 200", sector: "ETF", ticker: "069500.KS" },
];

export interface Holding {
  code: string;
  quantity: number;
  avgPrice: number;
}

/** 시드머니 1,000만 원 전액을 현금으로 시작합니다. */
export const INITIAL_CAPITAL = 10_000_000;
export const INITIAL_CASH = 10_000_000;

export const initialHoldings: Holding[] = [];
