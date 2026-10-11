import type { EvaluatedHolding } from "@/lib/portfolio-calc";
import { cn } from "@/lib/utils";
import type { Side } from "@/types/portfolio";

import { pct, tone, won } from "./format";
import { StockNameButton, TradeButtons } from "./trade-controls";

interface HoldingsTableProps {
  evaluated: EvaluatedHolding[];
  onChart: (code: string) => void;
  onTrade: (code: string, side: Side) => void;
}

export function HoldingsTable({ evaluated, onChart, onTrade }: HoldingsTableProps) {
  return (
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
                    <StockNameButton name={h.stock.name} onClick={() => onChart(h.code)} />
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
                      onBuy={() => onTrade(h.code, "buy")}
                      onSell={() => onTrade(h.code, "sell")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
