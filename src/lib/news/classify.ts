import { stocks } from "@/data/stocks";
import type { NewsCategory } from "@/types/news";

// "[연합뉴스 이 시각 헤드라인]" 같은 모음성 기사
const ROUNDUP_TITLE = /이\s?시각\s?헤드라인|헤드라인|주요\s?뉴스|뉴스\s?모음|오늘의\s?뉴스|뉴스\s?브리핑/;

/** 모음성 헤드라인 기사면 true */
export const isRoundupTitle = (title: string) => ROUNDUP_TITLE.test(title);

// 금융·경제 핵심 키워드 (카테고리 키워드 외에 기업 실적류 포함)
const FINANCE_KEYWORDS =
  /환율|원\/달러|달러|엔화|외환|금리|국채|연준|채권|코스피|코스닥|증시|지수|ETF|주가|투자자|거래소|실적|배당|영업이익|순이익|매출|증권|상장|공모|인수합병|M&A|자사주|시가총액|물가|무역수지|수출|GDP|경상수지/;

const STOCK_NAMES = stocks.map((s) => s.name);

/** 카테고리를 판별한다. 금융·경제 기사가 아니면 null (카드로 만들지 않음) */
export function categorize(text: string): NewsCategory | null {
  if (/환율|원\/달러|달러|엔화|외환/.test(text)) return "환율";
  if (/금리|국채|연준|기준금리|한국은행|한은|채권/.test(text)) return "금리";
  if (/코스피|코스닥|증시|지수|ETF|주가|투자자|거래소/.test(text)) return "시장";
  if (FINANCE_KEYWORDS.test(text) || STOCK_NAMES.some((n) => text.includes(n))) return "기업";
  return null;
}
