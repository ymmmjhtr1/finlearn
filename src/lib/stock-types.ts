import type { Stock } from "@/types/stock";

export interface PricePoint {
  /** MM/DD */
  label: string;
  price: number;
}

/** /api/stocks 가 종목 코드별로 돌려주는 시세 */
export interface Quote {
  /** 현재가 (장 마감 후·휴장일에는 가장 최근 거래일 종가) */
  price: number;
  /** 전일 대비 변동폭 */
  change: number;
  /** 등락률(%) */
  changeRate: number;
  marketState: string;
  /** 시세 기준 시각 (ISO) */
  asOf: string;
  /** 최근 일봉 종가 (오래된 순, 최대 30개) */
  history: PricePoint[];
}

export interface StocksResponse {
  fetchedAt: string;
  quotes: Record<string, Quote>;
}

/** 종목 정보 + 실시간 시세 */
export type LiveStock = Stock & Quote;
