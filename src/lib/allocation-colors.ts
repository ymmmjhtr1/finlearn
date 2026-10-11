/** 도넛 차트 한 조각. 같은 자산은 거래 후에도 같은 색을 갖도록 고정 키로 색을 정한다. */
export interface AllocationSlice {
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
