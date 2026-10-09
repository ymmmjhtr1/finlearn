"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface AllocationSlice {
  /** 같은 자산은 거래 후에도 같은 색을 갖도록 고정 키로 색을 정한다. */
  key: string;
  name: string;
  value: number;
  color: string;
}

export const CASH_COLOR = "#94a3b8";
// 종목별 팔레트 (종목 순서에 고정)
export const STOCK_COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
  "#84cc16",
  "#f97316",
];

const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
const percent = (value: number, total: number) =>
  total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";

/** 만 단위 이상은 줄여서 표시 (도넛 중앙처럼 좁은 곳용) */
function compactWon(n: number): string {
  const v = Math.round(n);
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(2)}억원`;
  if (v >= 10_000) return `${Math.round(v / 10_000).toLocaleString("ko-KR")}만원`;
  return won(v);
}

interface TooltipPayload {
  payload?: AllocationSlice;
}

export function AllocationChart({ slices, total }: { slices: AllocationSlice[]; total: number }) {
  // 자산이 전혀 없는 극단적인 경우에도 차트가 비지 않도록 빈 조각 하나를 둔다.
  const data = slices.some((s) => s.value > 0)
    ? slices.filter((s) => s.value > 0)
    : [{ key: "cash", name: "보유 현금", value: 1, color: CASH_COLOR }];

  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">자산 배분 비중</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative mx-auto h-56 w-full max-w-xs"
          role="img"
          aria-label={`자산 배분: ${data.map((s) => `${s.name} ${percent(s.value, total)}`).join(", ")}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="90%"
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="none"
                animationDuration={500}
              >
                {data.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  const slice = active ? (payload?.[0] as TooltipPayload | undefined)?.payload : undefined;
                  if (!slice) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                      <div className="mb-1 flex items-center gap-1.5 font-semibold">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        {slice.name}
                      </div>
                      <div>{won(slice.value)}</div>
                      <div className="text-muted-foreground">비중 {percent(slice.value, total)}</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* 도넛 정중앙 텍스트: 차트 위에 겹쳐 놓고 마우스 이벤트는 통과시킨다 */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">총 자산</span>
            <span className="text-lg font-bold leading-tight">{compactWon(total)}</span>
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
          {data.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
              <span className="text-muted-foreground">{percent(s.value, total)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
