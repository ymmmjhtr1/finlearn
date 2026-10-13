"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { quoteTrade, type TradeQuote } from "@/lib/portfolio-calc";
import type { LiveStock } from "@/types/stock";
import { cn } from "@/lib/utils";
import type { Side } from "@/types/portfolio";

import { won } from "@/lib/format";

export interface TradeTarget {
  code: string;
  side: Side;
}

interface TradeDialogProps {
  /** 열려 있는 거래. null이면 닫힘. 새 객체가 들어올 때마다 수량이 1로 돌아간다. */
  trade: TradeTarget | null;
  stock: LiveStock | null;
  held: number;
  cash: number;
  feeEnabled: boolean;
  onClose: () => void;
  onExecute: (qty: number, quote: TradeQuote) => void;
}

export function TradeDialog({
  trade,
  stock,
  held,
  cash,
  feeEnabled,
  onClose,
  onExecute,
}: TradeDialogProps) {
  const [qty, setQty] = useState(1);
  const [prevTrade, setPrevTrade] = useState(trade);
  if (trade !== prevTrade) {
    setPrevTrade(trade);
    setQty(1);
  }

  const isBuy = trade?.side === "buy";
  const quote =
    trade && stock
      ? quoteTrade({ side: trade.side, price: stock.price, qty, cash, held, feeEnabled })
      : null;
  const tradeAmount = quote?.amount ?? 0;
  const tradeCost = { fee: quote?.fee ?? 0, tax: quote?.tax ?? 0 };
  const tradeCostTotal = quote?.costTotal ?? 0;
  const maxQty = quote?.maxQty ?? 0;
  const cashAfter = quote?.cashAfter ?? cash;
  const tradeError = quote?.error ?? null;

  function execute() {
    if (!quote || qty < 1 || tradeError) return;
    onExecute(qty, quote);
  }

  return (
    <Dialog open={trade !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {trade && stock && (
          <>
            <DialogHeader>
              <DialogTitle>
                {stock.name}{" "}
                <span className={isBuy ? "text-rose-500" : "text-blue-500"}>
                  {isBuy ? "매수" : "매도"}
                </span>
              </DialogTitle>
              <DialogDescription>
                현재가 {won(stock.price)} · 보유 {held}주
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3">
              <label htmlFor="trade-qty" className="text-sm font-medium">
                수량
              </label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="수량 감소"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus />
                </Button>
                <input
                  id="trade-qty"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
                  className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="수량 증가"
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-1">
              <Button variant="outline" size="sm" onClick={() => setQty(1)}>
                1주
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={maxQty < 1}
                onClick={() => setQty(Math.max(1, Math.floor(maxQty / 2)))}
              >
                절반
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={maxQty < 1}
                onClick={() => setQty(Math.max(1, maxQty))}
              >
                {isBuy ? "최대" : "전량"}
              </Button>
            </div>

            <dl className="flex flex-col gap-2 rounded-lg bg-muted p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">현재 보유 현금</dt>
                <dd>{won(cash)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">예상 체결금액 ({isBuy ? "−" : "+"})</dt>
                <dd className={cn("font-semibold", isBuy ? "text-rose-500" : "text-blue-500")}>
                  {won(tradeAmount)}
                </dd>
              </div>
              {feeEnabled && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">증권사 수수료 (0.015%)</dt>
                    <dd>−{won(tradeCost.fee)}</dd>
                  </div>
                  {!isBuy && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">증권거래세 (0.18%)</dt>
                      <dd>−{won(tradeCost.tax)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {isBuy ? "총 결제 금액" : "실 수령 금액"}
                    </dt>
                    <dd className="font-semibold">
                      {won(isBuy ? tradeAmount + tradeCostTotal : tradeAmount - tradeCostTotal)}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t pt-2">
                <dt className="font-medium">거래 후 남은 잔고</dt>
                <dd className={cn("font-bold", cashAfter < 0 && "text-destructive")}>
                  {won(cashAfter)}
                </dd>
              </div>
            </dl>
            {tradeError && (
              <p role="alert" className="text-sm text-destructive">
                {tradeError}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button
                disabled={!!tradeError}
                className={
                  isBuy
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }
                onClick={execute}
              >
                {isBuy ? "매수 체결" : "매도 체결"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
