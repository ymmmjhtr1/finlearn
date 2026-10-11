import { cn } from "@/lib/utils";

export function FeeSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        role="switch"
        id="fee-switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={cn(
          "relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          enabled ? "bg-primary" : "bg-muted-foreground/40"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-4 rounded-full bg-background transition-transform",
            enabled && "translate-x-4"
          )}
        />
      </button>
      <label htmlFor="fee-switch" className="cursor-pointer">
        거래 수수료/세금 반영
        <span className="ml-1 text-xs text-muted-foreground">(매수 0.015% · 매도 0.195%)</span>
      </label>
    </div>
  );
}
