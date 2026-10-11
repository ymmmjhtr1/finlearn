import {
  CASH_COLOR,
  STOCK_COLORS,
  type AllocationSlice,
} from "@/lib/allocation-colors";
import { INITIAL_CAPITAL } from "@/data/portfolio";
import { stocks } from "@/data/stocks";
import { calcTradeCost } from "@/lib/portfolio-storage";
import type { SavedState, Side, Transaction } from "@/types/portfolio";
import type { Holding, Stock } from "@/types/stock";

/** 거래 내역 보관 한도 (오래된 것부터 버린다) */
export const HISTORY_LIMIT = 200;

export const stockInfoByCode: Record<string, Stock> = Object.fromEntries(
  stocks.map((s) => [s.code, s])
);

export interface EvaluatedHolding extends Holding {
  stock: Stock & { price: number };
  /** 평가금액 */
  value: number;
  /** 평가손익 (평가금액 − 매수원금) */
  profit: number;
  /** 수익률 (%) */
  rate: number;
}

export interface PortfolioSummary {
  stockValue: number;
  totalAsset: number;
  totalProfit: number;
  totalRate: number;
}

/** 보유 종목을 현재가로 평가한다. 시세가 없는 종목은 평단가로 평가해 손익이 0으로 보이게 한다. */
export function evaluate(
  holdings: Holding[],
  liveByCode: Record<string, { price: number } | undefined>
): EvaluatedHolding[] {
  return holdings.map((h) => {
    const stock = { ...stockInfoByCode[h.code], price: liveByCode[h.code]?.price ?? h.avgPrice };
    const value = stock.price * h.quantity;
    const cost = h.avgPrice * h.quantity;
    return { ...h, stock, value, profit: value - cost, rate: ((value - cost) / cost) * 100 };
  });
}

/** 총 자산과 누적 손익. 기준 자본은 초기 자본금 + 퀴즈 보상 누적액이다. */
export function summarize(
  evaluated: EvaluatedHolding[],
  cash: number,
  bonusCash: number
): PortfolioSummary {
  const stockValue = evaluated.reduce((sum, h) => sum + h.value, 0);
  const totalAsset = cash + stockValue;
  const capital = INITIAL_CAPITAL + bonusCash;
  const totalProfit = totalAsset - capital;
  return { stockValue, totalAsset, totalProfit, totalRate: (totalProfit / capital) * 100 };
}

/** 도넛 차트용 자산 구성: 현금 + 보유 종목별 평가금액 (종목 색은 종목 순서에 고정) */
export function buildSlices(evaluated: EvaluatedHolding[], cash: number): AllocationSlice[] {
  return [
    { key: "cash", name: "보유 현금", value: cash, color: CASH_COLOR },
    ...evaluated.map((h) => ({
      key: h.code,
      name: h.stock.name,
      value: h.value,
      color: STOCK_COLORS[stocks.findIndex((x) => x.code === h.code) % STOCK_COLORS.length],
    })),
  ];
}

export interface TradeInput {
  side: Side;
  price: number;
  /** 주문 수량 */
  qty: number;
  cash: number;
  /** 현재 보유 수량 */
  held: number;
  feeEnabled: boolean;
}

export interface TradeQuote {
  /** 체결 금액 (수수료/세금 제외) */
  amount: number;
  fee: number;
  tax: number;
  /** 수수료 + 세금 */
  costTotal: number;
  /** 거래 후 남는 현금 */
  cashAfter: number;
  maxQty: number;
  error: string | null;
}

/** 매수는 수수료까지 더한 금액이 현금을 넘지 않는 최대 수량, 매도는 보유 수량 */
export function getMaxQty(
  side: Side,
  { cash, price, held, feeEnabled }: Pick<TradeInput, "cash" | "price" | "held" | "feeEnabled">
): number {
  if (side === "sell") return held;
  let max = Math.floor(cash / price);
  while (max > 0 && price * max + calcTradeCost("buy", price * max, feeEnabled).fee > cash) {
    max -= 1;
  }
  return max;
}

/** 주문 미리보기와 체결이 같은 계산을 쓰도록 한 곳에서 금액·비용·잔고·오류를 계산한다. */
export function quoteTrade(input: TradeInput): TradeQuote {
  const { side, price, qty, cash, held, feeEnabled } = input;
  const isBuy = side === "buy";
  const amount = price * qty;
  const { fee, tax } = calcTradeCost(side, amount, feeEnabled);
  const costTotal = fee + tax;
  const maxQty = getMaxQty(side, input);
  const cashAfter = isBuy ? cash - amount - costTotal : cash + amount - costTotal;
  const error =
    qty > maxQty ? (isBuy ? "현금이 부족해요." : `보유 수량(${held}주)을 넘을 수 없어요.`) : null;
  return { amount, fee, tax, costTotal, cashAfter, maxQty, error };
}

export interface ApplyTradeParams {
  code: string;
  name: string;
  side: Side;
  price: number;
  qty: number;
  quote: Pick<TradeQuote, "amount" | "fee" | "tax" | "costTotal">;
  /** 거래 기록의 id·일시. 순수 함수를 유지하려고 호출부에서 만들어 넘긴다. */
  meta: { id: string; date: string };
}

export type TradeableState = Pick<SavedState, "cashBalance" | "holdings" | "transactionHistory">;

/** 체결 결과를 반영한 새 현금·보유 종목·거래 내역을 돌려준다. 입력 상태는 바꾸지 않는다. */
export function applyTrade(state: TradeableState, p: ApplyTradeParams): TradeableState {
  const { code, side, qty, price, quote } = p;
  let holdings: Holding[];
  if (side === "buy") {
    const found = state.holdings.find((h) => h.code === code);
    if (!found) {
      holdings = [...state.holdings, { code, quantity: qty, avgPrice: price }];
    } else {
      const quantity = found.quantity + qty;
      const avgPrice = (found.avgPrice * found.quantity + quote.amount) / quantity;
      holdings = state.holdings.map((h) => (h.code === code ? { ...h, quantity, avgPrice } : h));
    }
  } else {
    holdings = state.holdings
      .map((h) => (h.code === code ? { ...h, quantity: h.quantity - qty } : h))
      .filter((h) => h.quantity > 0);
  }

  const record: Transaction = {
    id: p.meta.id,
    date: p.meta.date,
    code,
    name: p.name,
    type: side,
    quantity: qty,
    price,
    total: quote.amount,
    fee: quote.fee,
    tax: quote.tax,
  };

  return {
    cashBalance:
      side === "buy"
        ? state.cashBalance - quote.amount - quote.costTotal
        : state.cashBalance + quote.amount - quote.costTotal,
    holdings,
    transactionHistory: [record, ...state.transactionHistory].slice(0, HISTORY_LIMIT),
  };
}
