"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  AllocationChart,
  CASH_COLOR,
  STOCK_COLORS,
  type AllocationSlice,
} from "@/components/home/allocation-chart";
import { PORTFOLIO_STORAGE_KEY, calcTradeCost } from "@/lib/portfolio-storage";
import { StockChartDialog } from "@/components/home/stock-chart-dialog";
import {
  INITIAL_CAPITAL,
  INITIAL_CASH,
  initialHoldings,
  stocks,
  type Holding,
} from "@/data/mock";
import type { LiveStock, Quote, StocksResponse } from "@/lib/stock-types";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
// 한국 증시 관례: 상승 빨강, 하락 파랑
const tone = (n: number) =>
  n > 0 ? "text-rose-500" : n < 0 ? "text-blue-500" : "text-muted-foreground";

const toneBg = (n: number) =>
  n > 0
    ? "bg-rose-500/10 text-rose-500"
    : n < 0
      ? "bg-blue-500/10 text-blue-500"
      : "bg-muted text-muted-foreground";

const sectors = Array.from(new Set(stocks.map((s) => s.sector)));

const stockInfoByCode = Object.fromEntries(stocks.map((s) => [s.code, s]));

type Side = "buy" | "sell";

interface Transaction {
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

interface SavedState {
  /** 퀴즈 보상 등으로 추가 입금된 누적 금액. 수익 계산의 기준 자본에 포함된다. */
  bonusCash: number;
  cashBalance: number;
  holdings: Holding[];
  transactionHistory: Transaction[];
  /** 수수료/세금 반영 여부. 이전 버전 데이터에는 없으며 기본값은 true. */
  feeEnabled: boolean;
}

const STORAGE_KEY = PORTFOLIO_STORAGE_KEY;
const HISTORY_LIMIT = 200;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** localStorage 값을 검증해서 읽는다. 손상됐거나 없으면 null. */
function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!isNum(d?.cashBalance) || d.cashBalance < 0) return null;
    if (!Array.isArray(d.holdings) || !Array.isArray(d.transactionHistory)) return null;
    const holdings = (d.holdings as Holding[]).filter(
      (h) => stockInfoByCode[h?.code] && isNum(h.quantity) && h.quantity > 0 && isNum(h.avgPrice)
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

function StockNameButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="차트 보기"
      className="cursor-pointer rounded-sm font-medium transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {name}
    </button>
  );
}

function TradeButtons({
  canSell,
  onBuy,
  onSell,
}: {
  canSell: boolean;
  onBuy: () => void;
  onSell: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" className="bg-rose-500 text-white hover:bg-rose-600" onClick={onBuy}>
        매수
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
        disabled={!canSell}
        onClick={onSell}
      >
        매도
      </Button>
    </div>
  );
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function PortfolioSection() {
  const [cash, setCash] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [bonusCash, setBonusCash] = useState(0);
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // SSR/Hydration 불일치를 피하려고 마운트 후에만 localStorage를 읽는다.
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setCash(saved.cashBalance);
      setBonusCash(saved.bonusCash);
      setHoldings(saved.holdings);
      setHistory(saved.transactionHistory);
      setFeeEnabled(saved.feeEnabled);
    }
    setLoaded(true);
  }, []);

  // 로드가 끝난 뒤의 모든 변경을 즉시 저장한다.
  useEffect(() => {
    if (!loaded) return;
    try {
      const data: SavedState = {
        bonusCash,
        cashBalance: cash,
        holdings,
        transactionHistory: history,
        feeEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 저장소 사용 불가(시크릿 모드 등) 시에는 메모리 상태로만 동작
    }
  }, [loaded, cash, bonusCash, holdings, history, feeEnabled]);

  function resetAll() {
    setCash(INITIAL_CASH);
    setBonusCash(0);
    setHoldings(initialHoldings);
    setHistory([]);
    setMessage("투자 내역을 초기화했어요. 시드머니 1,000만 원으로 다시 시작해요.");
    setResetOpen(false);
  }
  const [trade, setTrade] = useState<{ code: string; side: Side } | null>(null);
  const [qty, setQty] = useState(1);
  const [chartCode, setChartCode] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, Quote> | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuotes = useCallback(async (signal?: AbortSignal) => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/stocks", { signal });
      if (!res.ok) throw new Error(String(res.status));
      const data: StocksResponse = await res.json();
      setQuotes(data.quotes);
      setFetchedAt(data.fetchedAt);
      setQuoteError(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setQuoteError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadQuotes(controller.signal);
    return () => controller.abort();
  }, [loadQuotes]);

  const liveStocks: LiveStock[] = useMemo(
    () => stocks.flatMap((s) => (quotes?.[s.code] ? [{ ...s, ...quotes[s.code] }] : [])),
    [quotes]
  );
  const liveByCode = useMemo(
    () => Object.fromEntries(liveStocks.map((s) => [s.code, s])),
    [liveStocks]
  );

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<string>("전체");

  const heldQty = (code: string) => holdings.find((h) => h.code === code)?.quantity ?? 0;

  const evaluated = holdings.map((h) => {
    // 시세를 받지 못한 종목은 평단가로 평가해 손익이 0으로 보이게 한다.
    const stock = { ...stockInfoByCode[h.code], price: liveByCode[h.code]?.price ?? h.avgPrice };
    const value = stock.price * h.quantity;
    const cost = h.avgPrice * h.quantity;
    return { ...h, stock, value, profit: value - cost, rate: ((value - cost) / cost) * 100 };
  });
  const stockValue = evaluated.reduce((sum, h) => sum + h.value, 0);
  const totalAsset = cash + stockValue;
  // 도넛 차트용 자산 구성: 현금 + 보유 종목별 평가금액 (종목 색은 종목 순서에 고정)
  const slices: AllocationSlice[] = [
    { key: "cash", name: "보유 현금", value: cash, color: CASH_COLOR },
    ...evaluated.map((h) => ({
      key: h.code,
      name: h.stock.name,
      value: h.value,
      color: STOCK_COLORS[stocks.findIndex((x) => x.code === h.code) % STOCK_COLORS.length],
    })),
  ];
  const totalProfit = totalAsset - (INITIAL_CAPITAL + bonusCash);
  const totalRate = (totalProfit / (INITIAL_CAPITAL + bonusCash)) * 100;

  const keyword = search.trim().toLowerCase();
  const visibleStocks = liveStocks.filter(
    (s) =>
      (sector === "전체" || s.sector === sector) &&
      (!keyword ||
        s.name.toLowerCase().includes(keyword) ||
        s.code.includes(keyword) ||
        s.ticker.toLowerCase().includes(keyword))
  );

  function tradeFromChart(code: string, side: Side) {
    setChartCode(null);
    openTrade(code, side);
  }

  function openTrade(code: string, side: Side) {
    setQty(1);
    setTrade({ code, side });
  }

  const tradeStock = trade ? liveByCode[trade.code] ?? null : null;
  const tradeHeld = trade ? heldQty(trade.code) : 0;
  const tradeAmount = tradeStock ? tradeStock.price * qty : 0;
  const isBuy = trade?.side === "buy";
  const tradeCost = calcTradeCost(trade?.side ?? "buy", tradeAmount, feeEnabled);
  const tradeCostTotal = tradeCost.fee + tradeCost.tax;
  let maxQty = 0;
  if (tradeStock) {
    if (isBuy) {
      // 수수료까지 더한 금액이 현금을 넘지 않는 최대 수량
      maxQty = Math.floor(cash / tradeStock.price);
      while (
        maxQty > 0 &&
        tradeStock.price * maxQty +
          calcTradeCost("buy", tradeStock.price * maxQty, feeEnabled).fee >
          cash
      ) {
        maxQty -= 1;
      }
    } else {
      maxQty = tradeHeld;
    }
  }
  const cashAfter = isBuy
    ? cash - tradeAmount - tradeCostTotal
    : cash + tradeAmount - tradeCostTotal;
  const tradeError =
    qty > maxQty
      ? isBuy
        ? "현금이 부족해요."
        : `보유 수량(${tradeHeld}주)을 넘을 수 없어요.`
      : null;

  function executeTrade() {
    if (!trade || !tradeStock || qty < 1 || tradeError) return;
    const { code, side } = trade;
    if (side === "buy") {
      setCash((c) => c - tradeAmount - tradeCostTotal);
      setHoldings((prev) => {
        const found = prev.find((h) => h.code === code);
        if (!found) return [...prev, { code, quantity: qty, avgPrice: tradeStock.price }];
        const quantity = found.quantity + qty;
        const avgPrice = (found.avgPrice * found.quantity + tradeAmount) / quantity;
        return prev.map((h) => (h.code === code ? { ...h, quantity, avgPrice } : h));
      });
    } else {
      setCash((c) => c + tradeAmount - tradeCostTotal);
      setHoldings((prev) =>
        prev
          .map((h) => (h.code === code ? { ...h, quantity: h.quantity - qty } : h))
          .filter((h) => h.quantity > 0)
      );
    }
    const record: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString(),
      code,
      name: tradeStock.name,
      type: side,
      quantity: qty,
      price: tradeStock.price,
      total: tradeAmount,
      fee: tradeCost.fee,
      tax: tradeCost.tax,
    };
    setHistory((prev) => [record, ...prev].slice(0, HISTORY_LIMIT));
    setMessage(
      `${tradeStock.name} ${qty}주를 ${won(tradeAmount)}에 ${side === "buy" ? "매수" : "매도"}했어요.${
        tradeCostTotal > 0 ? ` (수수료·세금 ${won(tradeCostTotal)})` : ""
      }`
    );
    setTrade(null);
  }

  if (!quotes) {
    return quoteError ? (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <p>실시간 시세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        <Button variant="outline" size="sm" disabled={refreshing} onClick={() => loadQuotes()}>
          다시 시도
        </Button>
      </div>
    ) : (
      <div className="flex animate-pulse flex-col gap-6" aria-busy aria-label="시세 불러오는 중">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-3">
          {[
            { label: "총 자산", value: won(totalAsset), sub: null, badge: true },
            { label: "투자 수익", value: won(totalProfit), sub: pct(totalRate), colored: totalProfit },
            { label: "보유 현금", value: won(cash), sub: null },
            { label: "주식 평가금액", value: won(stockValue), sub: null },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </CardHeader>
              <CardContent>
                <div className={cn("text-xl font-bold", s.colored !== undefined && tone(s.colored))}>
                  {s.value}
                </div>
                {s.sub && <div className={cn("text-sm", tone(s.colored ?? 0))}>{s.sub}</div>}
                {s.badge && (
                  <div
                    className={cn(
                      "mt-2 inline-flex flex-wrap items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      toneBg(totalProfit)
                    )}
                  >
                    <span>초기 자본 대비 {pct(totalRate)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {totalProfit > 0 ? "+" : ""}
                      {won(totalProfit)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-2">
          <AllocationChart slices={slices} total={totalAsset} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="min-h-5 text-sm text-primary">
          {message}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            role="switch"
            id="fee-switch"
            aria-checked={feeEnabled}
            onClick={() => setFeeEnabled((v) => !v)}
            className={cn(
              "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              feeEnabled ? "bg-primary" : "bg-muted-foreground/40"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 size-4 rounded-full bg-background transition-transform",
                feeEnabled && "translate-x-4"
              )}
            />
          </button>
          <label htmlFor="fee-switch" className="cursor-pointer">
            거래 수수료/세금 반영
            <span className="ml-1 text-xs text-muted-foreground">
              (매수 0.015% · 매도 0.195%)
            </span>
          </label>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">내 보유 종목</h2>
        {evaluated.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            보유 중인 종목이 없어요. 아래에서 매수해 보세요.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">종목</th>
                  <th className="p-3 text-right font-medium">수량</th>
                  <th className="p-3 text-right font-medium">매수 평균단가</th>
                  <th className="p-3 text-right font-medium">현재가</th>
                  <th className="p-3 text-right font-medium">평가금액</th>
                  <th className="p-3 text-right font-medium">평가손익</th>
                  <th className="p-3 text-right font-medium">수익률</th>
                  <th className="p-3 text-right font-medium">거래</th>
                </tr>
              </thead>
              <tbody>
                {evaluated.map((h) => (
                  <tr key={h.code} className="border-t">
                    <td className="p-3">
                      <StockNameButton name={h.stock.name} onClick={() => setChartCode(h.code)} />
                    </td>
                    <td className="p-3 text-right">{h.quantity}주</td>
                    <td className="p-3 text-right">{won(h.avgPrice)}</td>
                    <td className="p-3 text-right">{won(h.stock.price)}</td>
                    <td className="p-3 text-right">{won(h.value)}</td>
                    <td className={cn("p-3 text-right", tone(h.profit))}>
                      {h.profit > 0 ? "+" : ""}
                      {won(h.profit)}
                    </td>
                    <td className={cn("p-3 text-right font-medium", tone(h.profit))}>
                      {pct(h.rate)}
                    </td>
                    <td className="p-3">
                      <TradeButtons
                        canSell
                        onBuy={() => openTrade(h.code, "buy")}
                        onSell={() => openTrade(h.code, "sell")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">모의 거래</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {quoteError && <span className="text-destructive">갱신 실패 · 이전 시세 표시 중</span>}
            {fetchedAt && <span>Yahoo Finance · {formatDate(fetchedAt)} 조회</span>}
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => loadQuotes()}
            >
              <RefreshCw className={cn(refreshing && "animate-spin")} />
              시세 새로고침
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="종목명 또는 티커 검색 (예: 삼성, 005930, 247540.KQ)"
            aria-label="종목 검색"
            className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="섹터 필터">
          {["전체", ...sectors].map((name) => (
            <Button
              key={name}
              size="sm"
              variant={sector === name ? "default" : "outline"}
              onClick={() => setSector(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">종목</th>
                <th className="p-3 text-right font-medium">현재가</th>
                <th className="p-3 text-right font-medium">등락률</th>
                <th className="p-3 text-right font-medium">보유</th>
                <th className="p-3 text-right font-medium">거래</th>
              </tr>
            </thead>
            <tbody>
              {visibleStocks.map((s) => (
                <tr key={s.code} className="border-t">
                  <td className="p-3">
                    <StockNameButton name={s.name} onClick={() => setChartCode(s.code)} />
                    <div className="text-xs text-muted-foreground">
                      {s.code} · {s.sector}
                    </div>
                  </td>
                  <td className="p-3 text-right">{won(s.price)}</td>
                  <td className={cn("p-3 text-right", tone(s.changeRate))}>
                    {pct(s.changeRate)}
                  </td>
                  <td className="p-3 text-right">{heldQty(s.code)}주</td>
                  <td className="p-3">
                    <TradeButtons
                      canSell={heldQty(s.code) > 0}
                      onBuy={() => openTrade(s.code, "buy")}
                      onSell={() => openTrade(s.code, "sell")}
                    />
                  </td>
                </tr>
              ))}
              {visibleStocks.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    조건에 맞는 종목이 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          가상 시드머니 {won(INITIAL_CAPITAL)}으로 연습하는 모의투자이며, 시세는 Yahoo Finance의 실제 시세(장 마감·휴장 시 직전 거래일 종가, 일부 지연)를 쓰며, 거래는 가상이에요. 거래 내용은 이 브라우저에 저장되어 새로고침해도 유지돼요.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 거래 내역</h2>
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            <RotateCcw />
            투자 초기화
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">아직 거래 내역이 없어요.</p>
        ) : (
          <div className="max-h-96 overflow-auto rounded-xl border">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">거래 일시</th>
                  <th className="p-3 text-left font-medium">종목</th>
                  <th className="p-3 text-center font-medium">유형</th>
                  <th className="p-3 text-right font-medium">수량</th>
                  <th className="p-3 text-right font-medium">체결 단가</th>
                  <th className="p-3 text-right font-medium">총 거래금액</th>
                  <th className="p-3 text-right font-medium">수수료</th>
                  <th className="p-3 text-right font-medium">증권거래세</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3 text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="p-3 font-medium">{t.name}</td>
                    <td
                      className={cn(
                        "p-3 text-center font-medium",
                        t.type === "buy" ? "text-rose-500" : "text-blue-500"
                      )}
                    >
                      {t.type === "buy" ? "매수" : "매도"}
                    </td>
                    <td className="p-3 text-right">{t.quantity}주</td>
                    <td className="p-3 text-right">{won(t.price)}</td>
                    <td className="p-3 text-right">{won(t.total)}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {isNum(t.fee) ? won(t.fee) : "-"}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      {isNum(t.tax) ? won(t.tax) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StockChartDialog
        stock={chartCode ? liveByCode[chartCode] ?? null : null}
        heldQuantity={chartCode ? heldQty(chartCode) : 0}
        onClose={() => setChartCode(null)}
        onTrade={tradeFromChart}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>투자를 초기화할까요?</DialogTitle>
            <DialogDescription>
              보유 종목과 거래 내역이 모두 삭제되고, 현금 {won(INITIAL_CASH)}으로 다시 시작해요. 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={resetAll}>
              초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={trade !== null} onOpenChange={(open) => !open && setTrade(null)}>
        <DialogContent>
          {trade && tradeStock && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {tradeStock.name}{" "}
                  <span className={isBuy ? "text-rose-500" : "text-blue-500"}>
                    {isBuy ? "매수" : "매도"}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  현재가 {won(tradeStock.price)} · 보유 {tradeHeld}주
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-between gap-3">
                <label htmlFor="trade-qty" className="text-sm font-medium">
                  수량
                </label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="수량 감소"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus />
                  </Button>
                  <input
                    id="trade-qty"
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Math.floor(Number(e.target.value)) || 1))
                    }
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="수량 증가"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => setQty(1)}>
                  1주
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={maxQty < 1}
                  onClick={() => setQty(Math.max(1, Math.floor(maxQty / 2)))}
                >
                  절반
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={maxQty < 1}
                  onClick={() => setQty(Math.max(1, maxQty))}
                >
                  {isBuy ? "최대" : "전량"}
                </Button>
              </div>

              <dl className="flex flex-col gap-2 rounded-lg bg-muted p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">현재 보유 현금</dt>
                  <dd>{won(cash)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    예상 체결금액 ({isBuy ? "−" : "+"})
                  </dt>
                  <dd className={cn("font-semibold", isBuy ? "text-rose-500" : "text-blue-500")}>
                    {won(tradeAmount)}
                  </dd>
                </div>
                {feeEnabled && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">증권사 수수료 (0.015%)</dt>
                      <dd>−{won(tradeCost.fee)}</dd>
                    </div>
                    {!isBuy && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">증권거래세 (0.18%)</dt>
                        <dd>−{won(tradeCost.tax)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        {isBuy ? "총 결제 금액" : "실 수령 금액"}
                      </dt>
                      <dd className="font-semibold">
                        {won(isBuy ? tradeAmount + tradeCostTotal : tradeAmount - tradeCostTotal)}
                      </dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-2">
                  <dt className="font-medium">거래 후 남은 잔고</dt>
                  <dd className={cn("font-bold", cashAfter < 0 && "text-destructive")}>
                    {won(cashAfter)}
                  </dd>
                </div>
              </dl>
              {tradeError && (
                <p role="alert" className="text-sm text-destructive">
                  {tradeError}
                </p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setTrade(null)}>
                  취소
                </Button>
                <Button
                  disabled={!!tradeError}
                  className={
                    isBuy
                      ? "bg-rose-500 text-white hover:bg-rose-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }
                  onClick={executeTrade}
                >
                  {isBuy ? "매수 체결" : "매도 체결"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
