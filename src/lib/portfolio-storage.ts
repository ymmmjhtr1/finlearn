import { INITIAL_CASH } from "@/data/portfolio";

import { STORAGE_KEYS } from "@/lib/storage-keys";

/** 증권사 위탁수수료율 (매수·매도 공통) */
export const BROKER_FEE_RATE = 0.00015;
/** 증권거래세율 (매도 시에만 부과) */
export const SECURITIES_TAX_RATE = 0.0018;

export interface TradeCost {
  fee: number;
  tax: number;
}

/**
 * 거래 금액에 대한 수수료/증권거래세를 계산한다. 원 미만은 절사한다.
 * enabled가 false면 비용은 0이다.
 */
export function calcTradeCost(side: "buy" | "sell", amount: number, enabled = true): TradeCost {
  if (!enabled || amount <= 0) return { fee: 0, tax: 0 };
  return {
    fee: Math.floor(amount * BROKER_FEE_RATE),
    tax: side === "sell" ? Math.floor(amount * SECURITIES_TAX_RATE) : 0,
  };
}

/**
 * 모의투자 잔고(localStorage)에 보상금을 입금한다.
 * 저장된 모의투자 데이터가 없으면 기본 자산(1,000만 원)에서 시작해 새로 만든다.
 * 보상금은 bonusCash에도 누적되어, 모의투자 탭의 투자 수익이 부풀려지지 않는다.
 * @returns 저장 성공 여부 (저장소를 쓸 수 없으면 false)
 */
export function depositReward(amount: number): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    let state: Record<string, unknown> | null = null;
    try {
      state = raw ? JSON.parse(raw) : null;
    } catch {
      state = null;
    }
    const valid =
      state &&
      typeof state.cashBalance === "number" &&
      Array.isArray(state.holdings) &&
      Array.isArray(state.transactionHistory);

    const base = valid
      ? (state as { cashBalance: number; bonusCash?: number })
      : { cashBalance: INITIAL_CASH, bonusCash: 0, holdings: [], transactionHistory: [] };
    const next = {
      ...(valid ? state : base),
      cashBalance: base.cashBalance + amount,
      bonusCash: (typeof base.bonusCash === "number" ? base.bonusCash : 0) + amount,
    };
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
