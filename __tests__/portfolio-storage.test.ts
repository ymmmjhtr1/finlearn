import { afterEach, describe, expect, it, vi } from "vitest";

import { INITIAL_CASH } from "@/data/portfolio";
import { depositReward, loadSaved, saveState } from "@/lib/portfolio-storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { SavedState } from "@/types/portfolio";

const KEY = STORAGE_KEYS.PORTFOLIO;

/** node 환경에는 localStorage가 없으므로 Map 기반 모의 객체를 주입한다. */
function mockLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void data.set(k, v)),
    removeItem: vi.fn((k: string) => void data.delete(k)),
  };
  vi.stubGlobal("localStorage", storage);
  return { data, storage };
}

const state = (over: Partial<SavedState> = {}): SavedState => ({
  bonusCash: 0,
  cashBalance: 5_000_000,
  holdings: [{ code: "005930", quantity: 10, avgPrice: 70_000 }],
  transactionHistory: [
    { id: "t1", date: "2026-10-01T00:00:00.000Z", code: "005930", name: "삼성전자", type: "buy", quantity: 10, price: 70_000, total: 700_000 },
  ],
  feeEnabled: true,
  ...over,
});

afterEach(() => vi.unstubAllGlobals());

describe("loadSaved", () => {
  it("저장된 값이 없으면 null", () => {
    mockLocalStorage();
    expect(loadSaved()).toBeNull();
  });

  it("저장소 자체를 쓸 수 없어도 null", () => {
    // localStorage 미정의 → ReferenceError를 삼킨다
    expect(loadSaved()).toBeNull();
  });

  it("JSON이 손상됐으면 null", () => {
    mockLocalStorage({ [KEY]: "{broken json" });
    expect(loadSaved()).toBeNull();
  });

  it("구조가 맞지 않으면 null", () => {
    mockLocalStorage({ [KEY]: JSON.stringify({ cashBalance: 1000, holdings: "x", transactionHistory: [] }) });
    expect(loadSaved()).toBeNull();
    mockLocalStorage({ [KEY]: JSON.stringify(null) });
    expect(loadSaved()).toBeNull();
  });

  it("cashBalance가 음수이거나 숫자가 아니면 null", () => {
    mockLocalStorage({ [KEY]: JSON.stringify(state({ cashBalance: -1 })) });
    expect(loadSaved()).toBeNull();
    mockLocalStorage({ [KEY]: JSON.stringify({ ...state(), cashBalance: "5000000" }) });
    expect(loadSaved()).toBeNull();
  });

  it("cashBalance 0은 유효하다", () => {
    mockLocalStorage({ [KEY]: JSON.stringify(state({ cashBalance: 0 })) });
    expect(loadSaved()?.cashBalance).toBe(0);
  });

  it("알 수 없는 종목 코드와 잘못된 보유 항목을 제거한다", () => {
    mockLocalStorage({
      [KEY]: JSON.stringify({
        ...state(),
        holdings: [
          { code: "005930", quantity: 10, avgPrice: 70_000 },
          { code: "999999", quantity: 5, avgPrice: 1_000 }, // 없는 종목
          { code: "000660", quantity: 0, avgPrice: 100_000 }, // 수량 0
          { code: "035420", quantity: 3, avgPrice: "x" }, // 평단 비정상
          null,
        ],
      }),
    });
    expect(loadSaved()?.holdings).toEqual([{ code: "005930", quantity: 10, avgPrice: 70_000 }]);
  });

  it("거래 내역 중 형식이 맞지 않는 항목을 제거한다", () => {
    mockLocalStorage({
      [KEY]: JSON.stringify({
        ...state(),
        transactionHistory: [
          state().transactionHistory[0],
          { id: 1, date: "2026-10-01", total: 100 },
          { id: "t3", date: "2026-10-01", total: "100" },
          null,
        ],
      }),
    });
    expect(loadSaved()?.transactionHistory.map((t) => t.id)).toEqual(["t1"]);
  });

  it("bonusCash·feeEnabled가 없는 이전 버전 데이터는 기본값으로 채운다", () => {
    const { bonusCash: _b, feeEnabled: _f, ...legacy } = state();
    void _b;
    void _f;
    mockLocalStorage({ [KEY]: JSON.stringify(legacy) });
    expect(loadSaved()).toMatchObject({ bonusCash: 0, feeEnabled: true });
  });

  it("음수·비정상 bonusCash는 0으로 보정한다", () => {
    mockLocalStorage({ [KEY]: JSON.stringify(state({ bonusCash: -500 })) });
    expect(loadSaved()?.bonusCash).toBe(0);
  });
});

describe("saveState", () => {
  it("저장에 성공하면 true이고 loadSaved로 그대로 읽힌다", () => {
    const { data } = mockLocalStorage();
    const s = state({ bonusCash: 500_000, feeEnabled: false });
    expect(saveState(s)).toBe(true);
    expect(data.has(KEY)).toBe(true);
    expect(loadSaved()).toEqual(s);
  });

  it("저장소 쓰기에 실패하면 예외 없이 false", () => {
    const { storage } = mockLocalStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(saveState(state())).toBe(false);
  });

  it("저장소를 쓸 수 없는 환경에서도 false", () => {
    expect(saveState(state())).toBe(false);
  });
});

describe("depositReward", () => {
  it("저장된 값이 있으면 cashBalance와 bonusCash가 정확히 늘어나고 나머지는 유지된다", () => {
    mockLocalStorage({ [KEY]: JSON.stringify(state({ cashBalance: 3_000_000, bonusCash: 500_000, feeEnabled: false })) });
    expect(depositReward(500_000)).toBe(true);
    const after = loadSaved()!;
    expect(after.cashBalance).toBe(3_500_000);
    expect(after.bonusCash).toBe(1_000_000);
    expect(after.holdings).toEqual(state().holdings);
    expect(after.transactionHistory).toEqual(state().transactionHistory);
    expect(after.feeEnabled).toBe(false);
  });

  it("저장된 값이 없으면 기본 자산에서 시작해 새로 만든다", () => {
    mockLocalStorage();
    expect(depositReward(500_000)).toBe(true);
    expect(loadSaved()).toEqual({
      bonusCash: 500_000,
      cashBalance: INITIAL_CASH + 500_000,
      holdings: [],
      transactionHistory: [],
      feeEnabled: true,
    });
  });

  it("저장된 값이 손상됐으면 기본 자산에서 새로 시작한다", () => {
    mockLocalStorage({ [KEY]: "{broken" });
    expect(depositReward(500_000)).toBe(true);
    expect(loadSaved()?.cashBalance).toBe(INITIAL_CASH + 500_000);
  });

  it("여러 번 입금하면 누적된다", () => {
    mockLocalStorage();
    depositReward(500_000);
    depositReward(500_000);
    const s = loadSaved()!;
    expect(s.cashBalance).toBe(INITIAL_CASH + 1_000_000);
    expect(s.bonusCash).toBe(1_000_000);
  });

  it("저장소 쓰기에 실패하면 false이고 기존 값은 바뀌지 않는다", () => {
    const { data, storage } = mockLocalStorage({ [KEY]: JSON.stringify(state()) });
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(depositReward(500_000)).toBe(false);
    expect(JSON.parse(data.get(KEY)!)).toEqual(state());
  });
});
