import { describe, expect, it } from "vitest";

import {
  calcAveraging,
  calcCompound,
  calcDeposit,
  GENERAL_TAX_RATE,
  type AveragingParams,
  type CompoundParams,
  type DepositParams,
} from "@/lib/calculators";

describe("calcCompound", () => {
  const base: CompoundParams = { principal: 1_000_000, monthly: 0, ratePct: 12, years: 1 };

  it("월복리로 1년 뒤 최종 자산을 계산한다", () => {
    const r = calcCompound(base);
    expect(r.final).toBeCloseTo(1_000_000 * 1.01 ** 12, 4);
    expect(r.invested).toBe(1_000_000);
    expect(r.profit).toBeCloseTo(r.final - 1_000_000, 6);
  });

  it("이율 0%면 수익 없이 원금 + 적립금만 남는다", () => {
    const r = calcCompound({ principal: 1_000_000, monthly: 100_000, ratePct: 0, years: 2 });
    expect(r.final).toBe(3_400_000);
    expect(r.invested).toBe(3_400_000);
    expect(r.profit).toBe(0);
  });

  it("연도별 행은 0년차부터 연 단위로 쌓인다", () => {
    const r = calcCompound({ ...base, monthly: 50_000, years: 3 });
    expect(r.rows.map((row) => row.year)).toEqual([0, 1, 2, 3]);
    expect(r.rows[0]).toEqual({ year: 0, 원금: 1_000_000, 수익: 0 });
    expect(r.rows[3].원금).toBe(1_000_000 + 50_000 * 36);
  });

  it("기간의 소수 부분은 버린다", () => {
    const r = calcCompound({ ...base, years: 1.9 });
    expect(r.y).toBe(1);
    expect(r.rows).toHaveLength(2);
  });

  it("기간이 0이면 원금만 반환한다", () => {
    const r = calcCompound({ ...base, years: 0 });
    expect(r.final).toBe(1_000_000);
    expect(r.profit).toBe(0);
    expect(r.rows).toHaveLength(1);
  });

  it("대규모 금액·장기간에도 유한한 값을 유지한다", () => {
    const r = calcCompound({ principal: 10_000_000_000, monthly: 1_000_000_000, ratePct: 100, years: 50 });
    expect(Number.isFinite(r.final)).toBe(true);
    expect(r.final).toBeGreaterThan(r.invested);
    expect(r.rows).toHaveLength(51);
  });

  it("부동소수점 오차가 있어도 수익 + 원금 = 최종 자산이 성립한다", () => {
    const r = calcCompound({ principal: 123_456, monthly: 7_777, ratePct: 3.3, years: 7 });
    expect(r.invested + r.profit).toBeCloseTo(r.final, 6);
    const last = r.rows[r.rows.length - 1];
    expect(last.원금 + last.수익).toBeCloseTo(r.final, 6);
  });
});

describe("calcDeposit", () => {
  const deposit: DepositParams = { kind: "deposit", amount: 10_000_000, ratePct: 3.5, months: 12, tax: "general" };

  it("예금: 단리 세전 이자와 15.4% 과세를 계산한다", () => {
    const r = calcDeposit(deposit);
    expect(r.principal).toBe(10_000_000);
    expect(r.grossInterest).toBeCloseTo(350_000, 6);
    expect(r.taxAmount).toBeCloseTo(350_000 * GENERAL_TAX_RATE, 6);
    expect(r.netInterest).toBeCloseTo(296_100, 6);
    expect(r.maturity).toBeCloseTo(10_296_100, 6);
  });

  it("비과세면 세금이 0이다", () => {
    const r = calcDeposit({ ...deposit, tax: "free" });
    expect(r.taxAmount).toBe(0);
    expect(r.netInterest).toBe(r.grossInterest);
  });

  it("적금: 매월 납입분에 남은 개월 수만큼 이자가 붙는다", () => {
    const r = calcDeposit({ kind: "saving", amount: 100_000, ratePct: 12, months: 12, tax: "free" });
    expect(r.principal).toBe(1_200_000);
    expect(r.grossInterest).toBeCloseTo(78_000, 6);
    expect(r.maturity).toBeCloseTo(1_278_000, 6);
  });

  it("이율 0%면 이자와 세금이 없다", () => {
    const r = calcDeposit({ ...deposit, ratePct: 0 });
    expect(r.grossInterest).toBe(0);
    expect(r.taxAmount).toBe(0);
    expect(r.maturity).toBe(10_000_000);
  });

  it("기간의 소수 부분은 버리고 0개월이면 원금만 돌려받는다", () => {
    expect(calcDeposit({ ...deposit, months: 12.8 }).n).toBe(12);
    const r = calcDeposit({ ...deposit, months: 0 });
    expect(r.grossInterest).toBe(0);
    expect(r.maturity).toBe(10_000_000);
  });

  it("대규모 금액에서도 세후 이자 + 세금 = 세전 이자가 성립한다", () => {
    const r = calcDeposit({ kind: "saving", amount: 10_000_000_000, ratePct: 100, months: 120, tax: "general" });
    expect(Number.isFinite(r.maturity)).toBe(true);
    expect(r.netInterest + r.taxAmount).toBeCloseTo(r.grossInterest, 0);
  });
});

describe("calcAveraging", () => {
  const base: AveragingParams = { qty: 100, avgPrice: 70_000, addQty: 50, addPrice: 60_000 };

  it("물타기 후 평단가와 변화율을 계산한다", () => {
    const r = calcAveraging(base);
    expect(r.totalQty).toBe(150);
    expect(r.addCost).toBe(3_000_000);
    expect(r.totalCost).toBe(10_000_000);
    expect(r.newAvg).toBeCloseTo(66_666.6667, 3);
    expect(r.change).toBeCloseTo(-4.7619, 3);
    expect(r.breakEvenFromAdd).toBeCloseTo(11.1111, 3);
    expect(r.hasAdd).toBe(true);
  });

  it("단일 수량 매수도 올바르게 평균을 낸다", () => {
    const r = calcAveraging({ qty: 1, avgPrice: 100, addQty: 1, addPrice: 200 });
    expect(r.newAvg).toBe(150);
    expect(r.change).toBe(50);
    expect(r.breakEvenFromAdd).toBe(-25);
  });

  it("추가 매수가 없으면 평단가가 그대로이고 hasAdd는 false다", () => {
    const r = calcAveraging({ ...base, addQty: 0 });
    expect(r.newAvg).toBe(70_000);
    expect(r.change).toBe(0);
    expect(r.hasAdd).toBe(false);
  });

  it("보유·추가 수량이 모두 0이면 0으로 나누지 않는다", () => {
    const r = calcAveraging({ qty: 0, avgPrice: 0, addQty: 0, addPrice: 0 });
    expect(r.newAvg).toBe(0);
    expect(r.change).toBe(0);
    expect(r.breakEvenFromAdd).toBe(0);
  });

  it("대규모 수량·가격에서도 평단가가 유지된다", () => {
    const r = calcAveraging({ qty: 1_000_000_000, avgPrice: 100_000_000, addQty: 1_000_000_000, addPrice: 100_000_000 });
    expect(r.totalQty).toBe(2_000_000_000);
    expect(r.newAvg).toBeCloseTo(100_000_000, 0);
    expect(r.change).toBeCloseTo(0, 6);
  });

  it("부동소수점 소수 가격도 오차 범위 안에서 평균을 낸다", () => {
    const r = calcAveraging({ qty: 3, avgPrice: 0.1, addQty: 3, addPrice: 0.2 });
    expect(r.newAvg).toBeCloseTo(0.15, 10);
    expect(r.totalCost).toBeCloseTo(0.9, 10);
  });
});
