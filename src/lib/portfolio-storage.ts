import { INITIAL_CASH } from "@/data/mock";

export const PORTFOLIO_STORAGE_KEY = "finlearn:portfolio:v1";

/**
 * 모의투자 잔고(localStorage)에 보상금을 입금한다.
 * 저장된 모의투자 데이터가 없으면 기본 자산(1,000만 원)에서 시작해 새로 만든다.
 * 보상금은 bonusCash에도 누적되어, 모의투자 탭의 투자 수익이 부풀려지지 않는다.
 * @returns 저장 성공 여부 (저장소를 쓸 수 없으면 false)
 */
export function depositReward(amount: number): boolean {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
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
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}
