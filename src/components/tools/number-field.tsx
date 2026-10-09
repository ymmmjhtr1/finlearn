"use client";

import { cn } from "@/lib/utils";

interface NumberFieldProps {
  id: string;
  label: string;
  /** 콤마 없는 원본 문자열 (예: "1234.5") */
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  /** 소수점 입력 허용 (금리 등) */
  decimal?: boolean;
  /** 입력 가능한 최댓값. 넘으면 최댓값으로 고정 */
  max?: number;
  className?: string;
}

/** 입력 문자열에서 숫자(와 소수점 1개)만 남긴다. 음수 기호 등은 모두 버려진다. */
export function sanitizeNumber(raw: string, decimal: boolean): string {
  let s = raw.replace(decimal ? /[^\d.]/g : /\D/g, "");
  if (decimal) {
    const [int, ...rest] = s.split(".");
    s = rest.length ? `${int}.${rest.join("").slice(0, 2)}` : int;
  }
  // 앞자리 0 제거 ("007" → "7", "0.5"는 유지)
  return s.replace(/^0+(?=\d)/, "");
}

/** "1,234.5" 같은 표시용 문자열 */
export function formatNumber(value: string): string {
  if (!value) return "";
  const [int, frac] = value.split(".");
  const head = Number(int || "0").toLocaleString("ko-KR");
  return frac !== undefined ? `${head}.${frac}` : head;
}

export const toNum = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  decimal = false,
  max,
  className,
}: NumberFieldProps) {
  function handle(raw: string) {
    let next = sanitizeNumber(raw, decimal);
    if (max !== undefined && Number(next) > max) next = String(max);
    onChange(next);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={formatNumber(value)}
          onChange={(e) => handle(e.target.value)}
          placeholder="0"
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background pl-3 text-right text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring",
            suffix ? "pr-12" : "pr-3"
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
