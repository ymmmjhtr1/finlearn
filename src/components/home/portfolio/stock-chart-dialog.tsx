"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { won, pct, tone } from "@/lib/format";
import type { LiveStock } from "@/types/stock";

// 한국 증시 관례: 상승 빨강(rose-500), 하락 파랑(blue-500)
const UP = "#f43f5e";
const DOWN = "#3b82f6";


const RANGES = [
  { days: 7, label: "7거래일" },
  { days: 30, label: "30거래일" },
] as const;

interface StockChartDialogProps {
  stock: LiveStock | null;
  heldQuantity: number;
  onClose: () => void;
  onTrade: (code: string, side: "buy" | "sell") => void;
}

export function StockChartDialog({ stock, heldQuantity, onClose, onTrade }: StockChartDialogProps) {
  const [days, setDays] = useState<number>(30);

  const data = stock?.history.slice(-days) ?? [];

  const first = data[0]?.price ?? 0;
  const last = data[data.length - 1]?.price ?? 0;
  const periodRate = first ? ((last - first) / first) * 100 : 0;
  const color = last >= first ? UP : DOWN;
  const gradientId = `grad-${stock?.code ?? "x"}`;

  const prices = data.map((d) => d.price);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const pad = Math.max((max - min) * 0.15, 1);

  return (
    <Dialog open={stock !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {stock && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">{stock.name}</DialogTitle>
              <DialogDescription>
                {stock.code} · {stock.sector} · 보유 {heldQuantity}주
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className={cn("text-3xl font-bold", tone(stock.changeRate))}>
                  {won(stock.price)}
                </div>
                <div className={cn("text-sm", tone(stock.changeRate))}>
                  전일 대비 {stock.change > 0 ? "+" : ""}{won(stock.change)} ({pct(stock.changeRate)})
                </div>
              </div>
              <div className="flex items-center gap-1">
                {RANGES.map((r) => (
                  <Button
                    key={r.days}
                    size="sm"
                    variant={days === r.days ? "default" : "outline"}
                    onClick={() => setDays(r.days)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      domain={[min - pad, max + pad]}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                      tickFormatter={(v: number) => Math.round(v).toLocaleString("ko-KR")}
                    />
                    <Tooltip
                      formatter={(v) => [won(Number(v)), "종가"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--background))",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={color}
                      strokeWidth={2}
                      fill={`url(#${gradientId})`}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className={cn("mt-2 text-sm", tone(periodRate))}>
                최근 {data.length}거래일 {pct(periodRate)} ({last >= first ? "상승" : "하락"} 추세)
              </p>
              <p className="text-xs text-muted-foreground">
                일봉 종가 기준 실제 시세(Yahoo Finance)이며, 일부 지연될 수 있어요.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="bg-rose-500 text-white hover:bg-rose-600"
                onClick={() => onTrade(stock.code, "buy")}
              >
                매수
              </Button>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                disabled={heldQuantity === 0}
                onClick={() => onTrade(stock.code, "sell")}
              >
                매도
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
