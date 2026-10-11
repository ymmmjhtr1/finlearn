"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StockChartDialog } from "@/components/home/stock-chart-dialog";
import { FeeSwitch } from "@/components/home/portfolio/fee-switch";
import { won } from "@/components/home/portfolio/format";
import { HistoryTable } from "@/components/home/portfolio/history-table";
import { HoldingsTable } from "@/components/home/portfolio/holdings-table";
import { MarketTable } from "@/components/home/portfolio/market-table";
import { ResetDialog } from "@/components/home/portfolio/reset-dialog";
import { SummaryCards } from "@/components/home/portfolio/summary-cards";
import { TradeDialog, type TradeTarget } from "@/components/home/portfolio/trade-dialog";
import { useLiveQuotes } from "@/hooks/use-live-quotes";
import { usePortfolio } from "@/hooks/use-portfolio";
import type { TradeQuote } from "@/lib/portfolio-calc";
import type { Side } from "@/types/portfolio";

export function PortfolioSection() {
  const { quotes, fetchedAt, error: quoteError, refreshing, refresh, liveStocks, liveByCode } =
    useLiveQuotes();
  const {
    cash,
    history,
    feeEnabled,
    evaluated,
    summary,
    slices,
    heldQty,
    executeTrade: commitTrade,
    resetPortfolio,
    toggleFee,
  } = usePortfolio(liveByCode);

  const [trade, setTrade] = useState<TradeTarget | null>(null);
  const [chartCode, setChartCode] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const tradeStock = trade ? liveByCode[trade.code] ?? null : null;

  function openTrade(code: string, side: Side) {
    setTrade({ code, side });
  }

  function tradeFromChart(code: string, side: Side) {
    setChartCode(null);
    openTrade(code, side);
  }

  function executeTrade(qty: number, quote: TradeQuote) {
    if (!trade || !tradeStock) return;
    const { code, side } = trade;
    commitTrade({
      code,
      name: tradeStock.name,
      side,
      price: tradeStock.price,
      qty,
      meta: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString(),
      },
    });
    setMessage(
      `${tradeStock.name} ${qty}주를 ${won(quote.amount)}에 ${side === "buy" ? "매수" : "매도"}했어요.${
        quote.costTotal > 0 ? ` (수수료·세금 ${won(quote.costTotal)})` : ""
      }`
    );
    setTrade(null);
  }

  function resetAll() {
    resetPortfolio();
    setMessage("투자 내역을 초기화했어요. 시드머니 1,000만 원으로 다시 시작해요.");
    setResetOpen(false);
  }

  if (!quotes) {
    return quoteError ? (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <p>실시간 시세를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
        <Button variant="outline" size="sm" disabled={refreshing} onClick={refresh}>
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
      <SummaryCards summary={summary} cash={cash} slices={slices} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="min-h-5 text-sm text-primary">
          {message}
        </p>
        <FeeSwitch enabled={feeEnabled} onToggle={toggleFee} />
      </div>

      <HoldingsTable evaluated={evaluated} onChart={setChartCode} onTrade={openTrade} />

      <MarketTable
        liveStocks={liveStocks}
        heldQty={heldQty}
        fetchedAt={fetchedAt}
        quoteError={quoteError}
        refreshing={refreshing}
        onRefresh={refresh}
        onChart={setChartCode}
        onTrade={openTrade}
      />

      <HistoryTable history={history} onReset={() => setResetOpen(true)} />

      <StockChartDialog
        stock={chartCode ? liveByCode[chartCode] ?? null : null}
        heldQuantity={chartCode ? heldQty(chartCode) : 0}
        onClose={() => setChartCode(null)}
        onTrade={tradeFromChart}
      />

      <ResetDialog open={resetOpen} onOpenChange={setResetOpen} onConfirm={resetAll} />

      <TradeDialog
        trade={trade}
        stock={tradeStock}
        held={trade ? heldQty(trade.code) : 0}
        cash={cash}
        feeEnabled={feeEnabled}
        onClose={() => setTrade(null)}
        onExecute={executeTrade}
      />
    </div>
  );
}
