import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isNum } from "@/lib/portfolio-storage";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/portfolio";

import { formatDate, won } from "@/lib/format";

interface HistoryTableProps {
  history: Transaction[];
  onReset: () => void;
}

export function HistoryTable({ history, onReset }: HistoryTableProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">최근 거래 내역</h2>
        <Button variant="outline" size="sm" onClick={onReset}>
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
  );
}
