export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

// 한국 증시 관례: 상승 빨강, 하락 파랑
export const tone = (n: number) =>
  n > 0 ? "text-rose-500" : n < 0 ? "text-blue-500" : "text-muted-foreground";

export const toneBg = (n: number) =>
  n > 0
    ? "bg-rose-500/10 text-rose-500"
    : n < 0
      ? "bg-blue-500/10 text-blue-500"
      : "bg-muted text-muted-foreground";

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
