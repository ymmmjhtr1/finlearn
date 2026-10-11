import { Button } from "@/components/ui/button";

export function StockNameButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="차트 보기"
      className="cursor-pointer rounded-sm font-medium transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {name}
    </button>
  );
}

export function TradeButtons({
  canSell,
  onBuy,
  onSell,
}: {
  canSell: boolean;
  onBuy: () => void;
  onSell: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" className="bg-rose-500 text-white hover:bg-rose-600" onClick={onBuy}>
        매수
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
        disabled={!canSell}
        onClick={onSell}
      >
        매도
      </Button>
    </div>
  );
}
