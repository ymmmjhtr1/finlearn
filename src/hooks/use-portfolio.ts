"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";

import { INITIAL_CASH, initialHoldings } from "@/data/portfolio";
import {
  applyTrade,
  buildSlices,
  evaluate,
  quoteTrade,
  summarize,
  type ApplyTradeParams,
} from "@/lib/portfolio-calc";
import { loadSaved, saveState } from "@/lib/portfolio-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { SavedState } from "@/types/portfolio";

interface PortfolioState extends SavedState {
  /** 마운트 후 저장소 로드가 끝났는지. 끝나기 전에는 저장하지 않는다. */
  loaded: boolean;
}

type PortfolioAction =
  | { type: "hydrate"; saved: SavedState | null }
  | { type: "sync"; saved: SavedState }
  | { type: "trade"; params: Omit<ApplyTradeParams, "quote"> }
  | { type: "reset" }
  | { type: "toggleFee" };

const initialState: PortfolioState = {
  cashBalance: INITIAL_CASH,
  bonusCash: 0,
  holdings: initialHoldings,
  transactionHistory: [],
  feeEnabled: true,
  loaded: false,
};

function reducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...(action.saved ?? {}), loaded: true };
    case "sync":
      return { ...state, ...action.saved };
    case "trade": {
      const { code, side, price, qty } = action.params;
      const held = state.holdings.find((h) => h.code === code)?.quantity ?? 0;
      // 최신 상태 기준으로 다시 검증·계산해, 오래된 화면 값으로 체결되지 않게 한다.
      const quote = quoteTrade({
        side,
        price,
        qty,
        cash: state.cashBalance,
        held,
        feeEnabled: state.feeEnabled,
      });
      if (qty < 1 || quote.error) return state;
      const next = applyTrade(state, { ...action.params, quote });
      return { ...state, ...next };
    }
    case "reset":
      return {
        ...state,
        cashBalance: INITIAL_CASH,
        bonusCash: 0,
        holdings: initialHoldings,
        transactionHistory: [],
      };
    case "toggleFee":
      return { ...state, feeEnabled: !state.feeEnabled };
  }
}

/**
 * 모의투자 포트폴리오 상태(현금·보유 종목·거래 내역·수수료 토글)를 한 reducer로 관리하고,
 * localStorage 로드/저장/탭 간 동기화와 평가·요약·차트 조각 같은 파생값을 제공한다.
 */
export function usePortfolio(liveByCode: Record<string, { price: number } | undefined>) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loaded, cashBalance, bonusCash, holdings, transactionHistory, feeEnabled } = state;

  // SSR/Hydration 불일치를 피하려고 마운트 후에만 localStorage를 읽는다.
  useEffect(() => {
    dispatch({ type: "hydrate", saved: loadSaved() });
  }, []);

  // 다른 탭(퀴즈 보상 입금, 거래 등)에서 저장소가 바뀌면 메모리 상태를 최신 저장값으로 맞춘다.
  // 맞추지 않으면 이 탭의 오래된 상태가 다음 저장 때 다른 탭의 변경을 덮어쓴다.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEYS.PORTFOLIO) return;
      const saved = loadSaved();
      if (saved) dispatch({ type: "sync", saved });
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 로드가 끝난 뒤의 모든 변경을 즉시 저장한다.
  useEffect(() => {
    if (!loaded) return;
    saveState({ bonusCash, cashBalance, holdings, transactionHistory, feeEnabled });
  }, [loaded, cashBalance, bonusCash, holdings, transactionHistory, feeEnabled]);

  const evaluated = useMemo(() => evaluate(holdings, liveByCode), [holdings, liveByCode]);
  const summary = useMemo(
    () => summarize(evaluated, cashBalance, bonusCash),
    [evaluated, cashBalance, bonusCash]
  );
  const slices = useMemo(() => buildSlices(evaluated, cashBalance), [evaluated, cashBalance]);

  const heldQty = useCallback(
    (code: string) => holdings.find((h) => h.code === code)?.quantity ?? 0,
    [holdings]
  );

  const executeTrade = useCallback(
    (params: Omit<ApplyTradeParams, "quote">) => dispatch({ type: "trade", params }),
    []
  );
  const resetPortfolio = useCallback(() => dispatch({ type: "reset" }), []);
  const toggleFee = useCallback(() => dispatch({ type: "toggleFee" }), []);

  return {
    loaded,
    cash: cashBalance,
    bonusCash,
    holdings,
    history: transactionHistory,
    feeEnabled,
    evaluated,
    summary,
    slices,
    heldQty,
    executeTrade,
    resetPortfolio,
    toggleFee,
  };
}
