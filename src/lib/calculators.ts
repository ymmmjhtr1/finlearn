/** 계산기 순수 함수 — UI(components/tools/calculators.tsx)에서 분리. 반올림은 표시 단계(won)에서만 한다. */

/* ① 복리 적립 */
export interface CompoundParams {
  /** 초기 원금 */
  principal: number;
  /** 월 적립금 */
  monthly: number;
  /** 목표 연수익률(%) */
  ratePct: number;
  /** 투자 기간(년, 소수는 버림) */
  years: number;
}

export interface CompoundRow {
  year: number;
  원금: number;
  수익: number;
}

export interface CompoundResult {
  rows: CompoundRow[];
  final: number;
  invested: number;
  profit: number;
  /** 버림 처리된 투자 기간(년) */
  y: number;
}

export function calcCompound({ principal, monthly, ratePct, years }: CompoundParams): CompoundResult {
  const p = principal;
  const m = monthly;
  const r = ratePct / 100 / 12; // 월복리
  const y = Math.floor(years);

  let balance = p;
  const rows: CompoundRow[] = [{ year: 0, 원금: p, 수익: 0 }];
  for (let month = 1; month <= y * 12; month++) {
    balance = balance * (1 + r) + m; // 매월 이자가 붙고 월말에 적립
    if (month % 12 === 0) {
      const invested = p + m * month;
      rows.push({ year: month / 12, 원금: invested, 수익: balance - invested });
    }
  }
  const invested = p + m * y * 12;
  const profit = balance - invested;
  return { rows, final: balance, invested, profit, y };
}

/* ② 예·적금 세후 이자 */
export type DepositKind = "deposit" | "saving";
export type TaxKind = "general" | "free";

/** 이자소득세 14% + 지방소득세 1.4% */
export const GENERAL_TAX_RATE = 0.154;

export interface DepositParams {
  kind: DepositKind;
  /** 예금: 예치 금액 / 적금: 월 납입 금액 */
  amount: number;
  /** 연 금리(%, 단리) */
  ratePct: number;
  /** 기간(개월, 소수는 버림) */
  months: number;
  tax: TaxKind;
}

export interface DepositResult {
  principal: number;
  grossInterest: number;
  taxAmount: number;
  netInterest: number;
  maturity: number;
  /** 버림 처리된 기간(개월) */
  n: number;
}

export function calcDeposit({ kind, amount, ratePct, months, tax }: DepositParams): DepositResult {
  const a = amount;
  const r = ratePct / 100;
  const n = Math.floor(months);
  // 단리: 예금은 목돈 × 금리 × 기간, 적금은 매월 납입분이 남은 개월 수만큼 이자를 받는다.
  const principal = kind === "deposit" ? a : a * n;
  const grossInterest =
    kind === "deposit" ? (a * r * n) / 12 : (a * r * (n * (n + 1))) / 2 / 12;
  const taxRate = tax === "general" ? GENERAL_TAX_RATE : 0;
  const taxAmount = grossInterest * taxRate;
  const netInterest = grossInterest - taxAmount;
  return { principal, grossInterest, taxAmount, netInterest, maturity: principal + netInterest, n };
}

/* ③ 물타기 평단가 */
export interface AveragingParams {
  /** 현재 보유 수량 */
  qty: number;
  /** 현재 평단가 */
  avgPrice: number;
  /** 추가 매수 수량 */
  addQty: number;
  /** 추가 매수가 */
  addPrice: number;
}

export interface AveragingResult {
  totalQty: number;
  addCost: number;
  totalCost: number;
  newAvg: number;
  /** 평단가 변화율(%) */
  change: number;
  /** 추가 매수가 기준으로 새 평단가까지 올라야 하는 비율(%) */
  breakEvenFromAdd: number;
  hasAdd: boolean;
}

export function calcAveraging({ qty, avgPrice, addQty, addPrice }: AveragingParams): AveragingResult {
  const q1 = qty;
  const p1 = avgPrice;
  const q2 = addQty;
  const p2 = addPrice;
  const totalQty = q1 + q2;
  const addCost = q2 * p2;
  const totalCost = q1 * p1 + addCost;
  const newAvg = totalQty > 0 ? totalCost / totalQty : 0;
  const change = p1 > 0 ? ((newAvg - p1) / p1) * 100 : 0;
  // 새 평단가에 도달하려면 현재 주가가 얼마나 올라야 하는지(추가 매수가 기준)
  const breakEvenFromAdd = p2 > 0 ? ((newAvg - p2) / p2) * 100 : 0;
  return { totalQty, addCost, totalCost, newAvg, change, breakEvenFromAdd, hasAdd: q2 > 0 && p2 > 0 };
}
