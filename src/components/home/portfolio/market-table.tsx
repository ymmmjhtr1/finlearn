"use client";

import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { INITIAL_CAPITAL } from "@/data/portfolio";
import { stocks } from "@/data/stocks";
import type { LiveStock } from "@/lib/stock-types";
import { cn } from "@/lib/utils";
import type { Side } from "@/types/portfolio";

import { formatDate, pct, tone, won } from "./format";
import { StockNameButton, TradeButtons } from "./trade-controls";

const sectors = Array.from(new Set(stocks.map((s) => s.sector)));

interface MarketTableProps {
  liveStocks: LiveStock[];
  heldQty: (code: string) => number;
  fetchedAt: string | null;
  quoteError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onChart: (code: string) => void;
  onTrade: (code: string, side: Side) => void;
}

export function MarketTable({
  liveStocks,
  heldQty,
  fetchedAt,
  quoteError,
  refreshing,
  onRefresh,
  onChart,
  onTrade,
}: MarketTableProps) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState<string>("전체");

  const keyword = search.trim().toLowerCase();
  const visibleStocks = liveStocks.filter(
    (s) =>
      (sector === "전체" || s.sector === sector) &&
      (!keyword ||
        s.name.toLowerCase().includes(keyword) ||
        s.code.includes(keyword) ||
        s.ticker.toLowerCase().includes(keyword))
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">모의 거래</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {quoteError && <span className="text-destructive">갱신 실패 · 이전 시세 표시 중</span>}
          {fetchedAt && <span>Yahoo Finance · {formatDate(fetchedAt)} 조회</span>}
          <Button variant="outline" size="sm" disabled={refreshing} onClick={onRefresh}>
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
                  <StockNameButton name={s.name} onClick={() => onChart(s.code)} />
                  <div className="text-xs text-muted-foreground">
                    {s.code} · {s.sector}
                  </div>
                </td>
                <td className="p-3 text-right">{won(s.price)}</td>
                <td className={cn("p-3 text-right", tone(s.changeRate))}>{pct(s.changeRate)}</td>
                <td className="p-3 text-right">{heldQty(s.code)}주</td>
                <td className="p-3">
                  <TradeButtons
                    canSell={heldQty(s.code) > 0}
                    onBuy={() => onTrade(s.code, "buy")}
                    onSell={() => onTrade(s.code, "sell")}
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
  );
}
