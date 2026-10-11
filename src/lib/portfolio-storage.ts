import { INITIAL_CASH } from "@/data/portfolio";
import { stocks } from "@/data/stocks";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { SavedState, Transaction } from "@/types/portfolio";
import type { Holding } from "@/types/stock";

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const knownCodes = new Set(stocks.map((s) => s.code));

/** localStorage 값을 검증해서 읽는다. 손상됐거나 없으면 null. */
export function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!isNum(d?.cashBalance) || d.cashBalance < 0) return null;
    if (!Array.isArray(d.holdings) || !Array.isArray(d.transactionHistory)) return null;
    const holdings = (d.holdings as Holding[]).filter(
      (h) => knownCodes.has(h?.code) && isNum(h.quantity) && h.quantity > 0 && isNum(h.avgPrice)
    );
    const transactionHistory = (d.transactionHistory as Transaction[]).filter(
      (t) => typeof t?.id === "string" && typeof t.date === "string" && isNum(t.total)
    );
    return {
      bonusCash: isNum(d.bonusCash) && d.bonusCash > 0 ? d.bonusCash : 0,
      cashBalance: d.cashBalance,
      holdings,
      transactionHistory,
      feeEnabled: typeof d.feeEnabled === "boolean" ? d.feeEnabled : true,
    };
  } catch {
    return null;
  }
}

/** 현재 상태를 저장한다. 저장소를 쓸 수 없으면(시크릿 모드 등) 조용히 무시한다. */
export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(state));
  } catch {
    // 메모리 상태로만 동작
  }
}

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
