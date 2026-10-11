import type { Holding } from "@/types/stock";

export type Side = "buy" | "sell";

export interface Transaction {
  id: string;
  /** 거래 일시 (ISO 문자열) */
  date: string;
  code: string;
  name: string;
  type: Side;
  quantity: number;
  price: number;
  /** 체결 금액 (수수료/세금 제외) */
  total: number;
  /** 증권사 수수료 (이전 버전 데이터에는 없음) */
  fee?: number;
  /** 증권거래세 (매도 시, 이전 버전 데이터에는 없음) */
  tax?: number;
}

export interface SavedState {
  /** 퀴즈 보상 등으로 추가 입금된 누적 금액. 수익 계산의 기준 자본에 포함된다. */
  bonusCash: number;
  cashBalance: number;
  holdings: Holding[];
  transactionHistory: Transaction[];
  /** 수수료/세금 반영 여부. 이전 버전 데이터에는 없으며 기본값은 true. */
  feeEnabled: boolean;
}
