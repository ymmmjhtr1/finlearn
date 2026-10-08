"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  INITIAL_CAPITAL,
  INITIAL_CASH,
  initialHoldings,
  stocks,
  type Holding,
} from "@/data/mock";

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
// 한국 증시 관례: 상승 빨강, 하락 파랑
const tone = (n: number) =>
  n > 0 ? "text-red-600" : n < 0 ? "text-blue-600" : "text-muted-foreground";

const stockByCode = Object.fromEntries(stocks.map((s) => [s.code, s]));

export function PortfolioSection() {
  const [cash, setCash] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState<Holding[]>(initialHoldings);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);

  const qtyOf = (code: string) => quantities[code] ?? 1;

  const evaluated = holdings.map((h) => {
    const stock = stockByCode[h.code];
    const value = stock.price * h.quantity;
    const cost = h.avgPrice * h.quantity;
    return { ...h, stock, value, profit: value - cost, rate: ((value - cost) / cost) * 100 };
  });
  const stockValue = evaluated.reduce((sum, h) => sum + h.value, 0);
  const totalAsset = cash + stockValue;
  const totalProfit = totalAsset - INITIAL_CAPITAL;
  const totalRate = (totalProfit / INITIAL_CAPITAL) * 100;

  function buy(code: string) {
    const qty = qtyOf(code);
    const stock = stockByCode[code];
    const amount = stock.price * qty;
    if (amount > cash) {
      setMessage(`현금이 부족해요. (필요 ${won(amount)} / 보유 ${won(cash)})`);
      return;
    }
    setCash((c) => c - amount);
    setHoldings((prev) => {
      const found = prev.find((h) => h.code === code);
      if (!found) return [...prev, { code, quantity: qty, avgPrice: stock.price }];
      const quantity = found.quantity + qty;
      const avgPrice = (found.avgPrice * found.quantity + amount) / quantity;
      return prev.map((h) => (h.code === code ? { ...h, quantity, avgPrice } : h));
    });
    setMessage(`${stock.name} ${qty}주를 ${won(amount)}에 매수했어요.`);
  }

  function sell(code: string) {
    const qty = qtyOf(code);
    const stock = stockByCode[code];
    const found = holdings.find((h) => h.code === code);
    if (!found || found.quantity < qty) {
      setMessage(`보유 수량이 부족해요. (보유 ${found?.quantity ?? 0}주)`);
      return;
    }
    const amount = stock.price * qty;
    setCash((c) => c + amount);
    setHoldings((prev) =>
      prev
        .map((h) => (h.code === code ? { ...h, quantity: h.quantity - qty } : h))
        .filter((h) => h.quantity > 0)
    );
    setMessage(`${stock.name} ${qty}주를 ${won(amount)}에 매도했어요.`);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "총 자산", value: won(totalAsset), sub: null },
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
            </CardContent>
          </Card>
        ))}
      </div>

      <p role="status" className="min-h-5 text-sm text-primary">
        {message}
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">내 보유 종목</h2>
        {evaluated.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">
            보유 중인 종목이 없어요. 아래에서 매수해 보세요.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 text-left font-medium">종목</th>
                  <th className="p-3 text-right font-medium">수량</th>
                  <th className="p-3 text-right font-medium">평균 매수가</th>
                  <th className="p-3 text-right font-medium">현재가</th>
                  <th className="p-3 text-right font-medium">평가손익</th>
                </tr>
              </thead>
              <tbody>
                {evaluated.map((h) => (
                  <tr key={h.code} className="border-t">
                    <td className="p-3 font-medium">{h.stock.name}</td>
                    <td className="p-3 text-right">{h.quantity}주</td>
                    <td className="p-3 text-right">{won(h.avgPrice)}</td>
                    <td className="p-3 text-right">{won(h.stock.price)}</td>
                    <td className={cn("p-3 text-right", tone(h.profit))}>
                      {won(h.profit)}
                      <br />
                      <span className="text-xs">{pct(h.rate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">모의 거래</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="p-3 text-left font-medium">종목</th>
                <th className="p-3 text-right font-medium">현재가</th>
                <th className="p-3 text-right font-medium">등락률</th>
                <th className="p-3 text-right font-medium">수량</th>
                <th className="p-3 text-right font-medium">거래</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.code} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.code} · {s.sector}
                    </div>
                  </td>
                  <td className="p-3 text-right">{won(s.price)}</td>
                  <td className={cn("p-3 text-right", tone(s.changeRate))}>
                    {pct(s.changeRate)}
                  </td>
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      min={1}
                      aria-label={`${s.name} 거래 수량`}
                      value={qtyOf(s.code)}
                      onChange={(e) =>
                        setQuantities((q) => ({
                          ...q,
                          [s.code]: Math.max(1, Math.floor(Number(e.target.value)) || 1),
                        }))
                      }
                      className="h-8 w-16 rounded-md border border-input bg-background px-2 text-right"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="destructive" onClick={() => buy(s.code)}>
                        매수
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => sell(s.code)}
                      >
                        매도
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          가상 시드머니 {won(INITIAL_CAPITAL)}으로 연습하는 모의투자이며, 시세는 더미 데이터예요. 새로고침하면 초기화됩니다.
        </p>
      </section>
    </div>
  );
}
