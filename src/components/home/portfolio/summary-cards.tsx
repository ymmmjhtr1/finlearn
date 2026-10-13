import { AllocationChart } from "./allocation-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AllocationSlice } from "@/lib/allocation-colors";
import type { PortfolioSummary } from "@/lib/portfolio-calc";
import { cn } from "@/lib/utils";

import { pct, tone, toneBg, won } from "@/lib/format";

interface SummaryCardsProps {
  summary: PortfolioSummary;
  cash: number;
  slices: AllocationSlice[];
}

export function SummaryCards({ summary, cash, slices }: SummaryCardsProps) {
  const { stockValue, totalAsset, totalProfit, totalRate } = summary;
  return (
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
  );
}
