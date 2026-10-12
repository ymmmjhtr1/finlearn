import { describe, expect, it } from "vitest";

import {
  applyTrade,
  BROKER_FEE_RATE,
  calcTradeCost,
  getMaxQty,
  HISTORY_LIMIT,
  quoteTrade,
  SECURITIES_TAX_RATE,
  type ApplyTradeParams,
  type TradeableState,
} from "@/lib/portfolio-calc";

const META = { id: "tx-1", date: "2026-01-01T00:00:00.000Z" };

/**
 * UI와 같은 순서: 견적을 먼저 내고, 오류가 없을 때만 체결을 반영한다.
 * applyTrade 자체는 검증 없는 순수 함수이므로 실패 처리는 quoteTrade의 error가 담당한다.
 */
function execute(
  state: TradeableState,
  order: { code: string; side: "buy" | "sell"; price: number; qty: number; feeEnabled?: boolean }
) {
  const { code, side, price, qty, feeEnabled = true } = order;
  const held = state.holdings.find((h) => h.code === code)?.quantity ?? 0;
  const quote = quoteTrade({ side, price, qty, cash: state.cashBalance, held, feeEnabled });
  if (quote.error) return { ok: false as const, error: quote.error, state };
  const params: ApplyTradeParams = { code, name: "삼성전자", side, price, qty, quote, meta: META };
  return { ok: true as const, error: null, state: applyTrade(state, params) };
}

describe("calcTradeCost", () => {
  it("상수: 수수료율 0.015%, 거래세율 0.18%", () => {
    expect(BROKER_FEE_RATE).toBe(0.00015);
    expect(SECURITIES_TAX_RATE).toBe(0.0018);
  });

  it("매수는 수수료만 부과하고 거래세는 없다", () => {
    expect(calcTradeCost("buy", 1_000_000)).toEqual({ fee: 150, tax: 0 });
  });

  it("매도는 수수료와 거래세를 모두 부과한다", () => {
    expect(calcTradeCost("sell", 1_000_000)).toEqual({ fee: 150, tax: 1_800 });
  });

  it("원 미만은 절사한다", () => {
    // 수수료 1.5원 → 1원, 거래세 18원
    expect(calcTradeCost("sell", 10_000)).toEqual({ fee: 1, tax: 18 });
    // 0.15원 → 0원
    expect(calcTradeCost("buy", 1_000)).toEqual({ fee: 0, tax: 0 });
  });

  it("수수료 옵션이 꺼져 있으면 비용은 0이다", () => {
    expect(calcTradeCost("buy", 1_000_000, false)).toEqual({ fee: 0, tax: 0 });
    expect(calcTradeCost("sell", 1_000_000, false)).toEqual({ fee: 0, tax: 0 });
  });

  it("금액이 0 이하면 비용은 0이다", () => {
    expect(calcTradeCost("sell", 0)).toEqual({ fee: 0, tax: 0 });
    expect(calcTradeCost("sell", -100)).toEqual({ fee: 0, tax: 0 });
  });
});

describe("getMaxQty", () => {
  const base = { cash: 1_000_000, price: 100_000, held: 5 };

  it("수수료가 없으면 현금 ÷ 단가(내림)이다", () => {
    expect(getMaxQty("buy", { ...base, feeEnabled: false })).toBe(10);
    expect(getMaxQty("buy", { cash: 1_050_000, price: 100_000, held: 0, feeEnabled: false })).toBe(10);
  });

  it("수수료를 포함해도 현금을 넘지 않는 최대 수량이다", () => {
    // 10주 = 1,000,000원 + 수수료 150원 > 현금 → 9주
    expect(getMaxQty("buy", { ...base, feeEnabled: true })).toBe(9);
  });

  it("현금이 단가보다 적으면 0주다", () => {
    expect(getMaxQty("buy", { cash: 50_000, price: 100_000, held: 0, feeEnabled: true })).toBe(0);
  });

  it("매도는 보유 수량까지만 가능하다", () => {
    expect(getMaxQty("sell", { ...base, feeEnabled: true })).toBe(5);
    expect(getMaxQty("sell", { cash: 0, price: 100_000, held: 0, feeEnabled: true })).toBe(0);
  });
});

describe("quoteTrade", () => {
  it("매수: 체결금액 + 수수료만큼 현금이 줄어든다", () => {
    const q = quoteTrade({ side: "buy", price: 70_000, qty: 10, cash: 1_000_000, held: 0, feeEnabled: true });
    expect(q).toMatchObject({
      amount: 700_000,
      fee: 105,
      tax: 0,
      costTotal: 105,
      cashAfter: 299_895,
      maxQty: 14,
      error: null,
    });
  });

  it("매도: 체결금액에서 수수료와 거래세를 뺀 만큼 입금된다", () => {
    const q = quoteTrade({ side: "sell", price: 70_000, qty: 4, cash: 0, held: 10, feeEnabled: true });
    expect(q).toMatchObject({
      amount: 280_000,
      fee: 42,
      tax: 504,
      costTotal: 546,
      cashAfter: 279_454,
      maxQty: 10,
      error: null,
    });
  });

  it("수수료 옵션을 끄면 비용 없이 체결금액만 반영한다", () => {
    const buy = quoteTrade({ side: "buy", price: 70_000, qty: 10, cash: 1_000_000, held: 0, feeEnabled: false });
    expect(buy).toMatchObject({ fee: 0, tax: 0, costTotal: 0, cashAfter: 300_000 });
    const sell = quoteTrade({ side: "sell", price: 70_000, qty: 4, cash: 0, held: 10, feeEnabled: false });
    expect(sell).toMatchObject({ costTotal: 0, cashAfter: 280_000 });
  });

  it("현금이 부족한 매수는 오류를 돌려준다", () => {
    const q = quoteTrade({ side: "buy", price: 70_000, qty: 15, cash: 1_000_000, held: 0, feeEnabled: true });
    expect(q.error).toBe("현금이 부족해요.");
    expect(q.maxQty).toBe(14);
  });

  it("수수료 때문에 현금이 모자라는 경계도 오류다", () => {
    // 체결금액은 정확히 현금과 같지만 수수료 150원이 부족
    const q = quoteTrade({ side: "buy", price: 100_000, qty: 10, cash: 1_000_000, held: 0, feeEnabled: true });
    expect(q.error).toBe("현금이 부족해요.");
    const noFee = quoteTrade({ side: "buy", price: 100_000, qty: 10, cash: 1_000_000, held: 0, feeEnabled: false });
    expect(noFee.error).toBeNull();
  });

  it("보유 수량을 넘는 매도는 오류를 돌려준다", () => {
    const q = quoteTrade({ side: "sell", price: 70_000, qty: 11, cash: 0, held: 10, feeEnabled: true });
    expect(q.error).toBe("보유 수량(10주)을 넘을 수 없어요.");
  });
});

describe("applyTrade (체결 반영)", () => {
  const empty: TradeableState = { cashBalance: 1_000_000, holdings: [], transactionHistory: [] };

  it("신규 매수: 종목이 추가되고 현금이 체결금액+수수료만큼 줄어든다", () => {
    const r = execute(empty, { code: "005930", side: "buy", price: 70_000, qty: 10 });
    expect(r.ok).toBe(true);
    expect(r.state.cashBalance).toBe(299_895);
    expect(r.state.holdings).toEqual([{ code: "005930", quantity: 10, avgPrice: 70_000 }]);
    expect(r.state.transactionHistory[0]).toMatchObject({
      id: META.id,
      code: "005930",
      type: "buy",
      quantity: 10,
      price: 70_000,
      total: 700_000,
      fee: 105,
      tax: 0,
    });
  });

  it("현금 부족 시 매수는 실패하고 상태가 바뀌지 않는다", () => {
    const r = execute(empty, { code: "005930", side: "buy", price: 70_000, qty: 15 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("현금이 부족해요.");
    expect(r.state).toBe(empty);
  });

  it("보유 수량 초과 시 매도는 실패하고 상태가 바뀌지 않는다", () => {
    const state: TradeableState = {
      cashBalance: 0,
      holdings: [{ code: "005930", quantity: 10, avgPrice: 60_000 }],
      transactionHistory: [],
    };
    const r = execute(state, { code: "005930", side: "sell", price: 70_000, qty: 11 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("보유 수량(10주)을 넘을 수 없어요.");
    expect(r.state).toBe(state);
  });

  it("보유하지 않은 종목 매도는 실패한다", () => {
    const r = execute(empty, { code: "005930", side: "sell", price: 70_000, qty: 1 });
    expect(r.ok).toBe(false);
    expect(r.state).toBe(empty);
  });

  it("추가 매수 시 가중평균단가(평단가)를 계산한다", () => {
    const start: TradeableState = { cashBalance: 2_000_000, holdings: [], transactionHistory: [] };
    const first = execute(start, { code: "005930", side: "buy", price: 60_000, qty: 10, feeEnabled: false });
    const second = execute(first.state, { code: "005930", side: "buy", price: 70_000, qty: 10, feeEnabled: false });
    // (60,000×10 + 70,000×10) / 20 = 65,000
    expect(second.state.holdings).toEqual([{ code: "005930", quantity: 20, avgPrice: 65_000 }]);
    expect(second.state.cashBalance).toBe(2_000_000 - 600_000 - 700_000);
  });

  it("수량이 다른 분할 매수의 평단가도 가중평균이다", () => {
    const state: TradeableState = {
      cashBalance: 10_000_000,
      holdings: [{ code: "005930", quantity: 3, avgPrice: 50_000 }],
      transactionHistory: [],
    };
    const r = execute(state, { code: "005930", side: "buy", price: 80_000, qty: 7, feeEnabled: false });
    // (50,000×3 + 80,000×7) / 10 = 71,000
    expect(r.state.holdings[0]).toEqual({ code: "005930", quantity: 10, avgPrice: 71_000 });
  });

  it("일부 매도는 수량만 줄이고 평단가는 유지한다", () => {
    const state: TradeableState = {
      cashBalance: 0,
      holdings: [{ code: "005930", quantity: 10, avgPrice: 60_000 }],
      transactionHistory: [],
    };
    const r = execute(state, { code: "005930", side: "sell", price: 70_000, qty: 4 });
    expect(r.state.holdings).toEqual([{ code: "005930", quantity: 6, avgPrice: 60_000 }]);
    expect(r.state.cashBalance).toBe(279_454);
  });

  it("전량 매도하면 holdings에서 종목이 제거되고 현금이 정산된다", () => {
    const state: TradeableState = {
      cashBalance: 100_000,
      holdings: [
        { code: "005930", quantity: 10, avgPrice: 60_000 },
        { code: "000660", quantity: 2, avgPrice: 100_000 },
      ],
      transactionHistory: [],
    };
    const r = execute(state, { code: "005930", side: "sell", price: 70_000, qty: 10 });
    // 700,000 − 수수료 105 − 거래세 1,260 = 698,635 입금
    expect(r.state.holdings).toEqual([{ code: "000660", quantity: 2, avgPrice: 100_000 }]);
    expect(r.state.cashBalance).toBe(100_000 + 698_635);
    expect(r.state.transactionHistory[0]).toMatchObject({ type: "sell", total: 700_000, fee: 105, tax: 1_260 });
  });

  it("입력 상태를 변경하지 않는다", () => {
    const state: TradeableState = {
      cashBalance: 1_000_000,
      holdings: [{ code: "005930", quantity: 10, avgPrice: 60_000 }],
      transactionHistory: [],
    };
    const snapshot = structuredClone(state);
    execute(state, { code: "005930", side: "buy", price: 70_000, qty: 5 });
    expect(state).toEqual(snapshot);
  });

  it("거래 내역은 최신순으로 쌓이고 보관 한도를 넘지 않는다", () => {
    const old = Array.from({ length: HISTORY_LIMIT }, (_, i) => ({
      id: `old-${i}`,
      date: "2025-01-01T00:00:00.000Z",
      code: "005930",
      name: "삼성전자",
      type: "buy" as const,
      quantity: 1,
      price: 1,
      total: 1,
    }));
    const r = execute(
      { cashBalance: 1_000_000, holdings: [], transactionHistory: old },
      { code: "005930", side: "buy", price: 70_000, qty: 1 }
    );
    expect(r.state.transactionHistory).toHaveLength(HISTORY_LIMIT);
    expect(r.state.transactionHistory[0].id).toBe(META.id);
  });
});
