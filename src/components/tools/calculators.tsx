"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calcAveraging, calcCompound, calcDeposit, type DepositKind, type TaxKind } from "@/lib/calculators";
import { won, pct, tone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NumberField, toNum } from "@/components/tools/number-field";

// 한국 증시 관례: 수익 빨강, 손실 파랑

function ResultRow({
  label,
  value,
  strong,
  className,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-2", strong && "border-t pt-3", className)}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", strong ? "text-xl font-bold" : "font-medium")}>{value}</dd>
    </div>
  );
}

function CalcShell({ inputs, result }: { inputs: ReactNode; result: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">입력</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{inputs}</CardContent>
      </Card>
      <div className="flex flex-col gap-6 lg:col-span-3">{result}</div>
    </div>
  );
}

/* ① 복리 수익률 계산기 */
export function CompoundCalculator() {
  const [principal, setPrincipal] = useState("1000000");
  const [monthly, setMonthly] = useState("300000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("10");

  const calc = useMemo(
    () =>
      calcCompound({
        principal: toNum(principal),
        monthly: toNum(monthly),
        ratePct: toNum(rate),
        years: toNum(years),
      }),
    [principal, monthly, rate, years]
  );

  const profitShare = calc.final > 0 ? (calc.profit / calc.final) * 100 : 0;

  return (
    <CalcShell
      inputs={
        <>
          <NumberField id="cp-principal" label="초기 원금" value={principal} onChange={setPrincipal} suffix="원" max={10_000_000_000} />
          <NumberField id="cp-monthly" label="월 적립금" value={monthly} onChange={setMonthly} suffix="원" max={1_000_000_000} />
          <NumberField id="cp-rate" label="목표 연수익률" value={rate} onChange={setRate} suffix="%" decimal max={100} />
          <NumberField id="cp-years" label="투자 기간" value={years} onChange={setYears} suffix="년" max={50} />
          <p className="text-xs text-muted-foreground">월복리, 매월 말 적립 기준의 단순 계산이에요. 세금·수수료는 반영하지 않아요.</p>
        </>
      }
      result={
        <>
          <Card>
            <CardContent className="pt-6">
              <dl>
                <ResultRow label="총 투자 원금" value={won(calc.invested)} />
                <ResultRow label="예상 수익" value={<span className="text-rose-500">{won(calc.profit)}</span>} />
                <ResultRow label={`${calc.y}년 후 최종 자산`} value={<span className="text-primary">{won(calc.final)}</span>} strong />
              </dl>
              <div className="mt-4" aria-label="원금과 수익 비중">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  <div className="bg-slate-400 transition-all" style={{ width: `${100 - profitShare}%` }} />
                  <div className="bg-rose-500 transition-all" style={{ width: `${profitShare}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>원금 {(100 - profitShare).toFixed(1)}%</span>
                  <span>수익 {profitShare.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">연도별 누적 자산 성장</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calc.rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tickFormatter={(v: number) => `${v}년`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(v: number) => (v >= 100_000_000 ? `${(v / 100_000_000).toFixed(1)}억` : `${Math.round(v / 10_000).toLocaleString("ko-KR")}만`)}
                    />
                    <Tooltip
                      formatter={(v, name) => [won(Number(v)), String(name)]}
                      labelFormatter={(l) => `${l}년 후`}
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))", fontSize: 12 }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="원금" stackId="a" fill="#94a3b8" />
                    <Bar dataKey="수익" stackId="a" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      }
    />
  );
}

/* ② 예·적금 세후 이자 계산기 */
export function DepositCalculator() {
  const [kind, setKind] = useState<DepositKind>("deposit");
  const [amount, setAmount] = useState("10000000");
  const [rate, setRate] = useState("3.5");
  const [months, setMonths] = useState("12");
  const [tax, setTax] = useState<TaxKind>("general");

  const calc = useMemo(
    () => calcDeposit({ kind, amount: toNum(amount), ratePct: toNum(rate), months: toNum(months), tax }),
    [kind, amount, rate, months, tax]
  );

  return (
    <CalcShell
      inputs={
        <>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="상품 종류">
            {([["deposit", "예금(목돈)"], ["saving", "적금(매월 납입)"]] as const).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  kind === k ? "bg-background text-primary shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <NumberField
            id="dp-amount"
            label={kind === "deposit" ? "예치 금액" : "월 납입 금액"}
            value={amount}
            onChange={setAmount}
            suffix="원"
            max={10_000_000_000}
          />
          <NumberField id="dp-rate" label="연 금리 (단리)" value={rate} onChange={setRate} suffix="%" decimal max={100} />
          <NumberField id="dp-months" label="기간" value={months} onChange={setMonths} suffix="개월" max={120} />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">과세 방식</span>
            <div className="flex gap-2" role="group" aria-label="과세 방식">
              <Button type="button" size="sm" variant={tax === "general" ? "default" : "outline"} onClick={() => setTax("general")}>
                일반과세 15.4%
              </Button>
              <Button type="button" size="sm" variant={tax === "free" ? "default" : "outline"} onClick={() => setTax("free")}>
                비과세
              </Button>
            </div>
          </div>
        </>
      }
      result={
        <Card>
          <CardContent className="pt-6">
            <dl>
              <ResultRow label="총 납입 원금" value={won(calc.principal)} />
              <ResultRow label="세전 이자" value={won(calc.grossInterest)} />
              <ResultRow label={tax === "general" ? "이자소득세 (15.4%)" : "이자소득세 (비과세)"} value={<span className="text-blue-500">-{won(calc.taxAmount)}</span>} />
              <ResultRow label="세후 이자" value={<span className="text-rose-500">{won(calc.netInterest)}</span>} />
              <ResultRow label={`${calc.n}개월 후 만기 수령액`} value={<span className="text-primary">{won(calc.maturity)}</span>} strong />
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              이자소득세 14% + 지방소득세 1.4% = 15.4%를 단리로 계산한 예상치예요. 실제 금융상품의 우대금리·이자 지급 방식에 따라 달라질 수 있어요.
            </p>
          </CardContent>
        </Card>
      }
    />
  );
}

/* ③ 주식 평단가(물타기) 계산기 */
export function AveragingCalculator() {
  const [qty, setQty] = useState("100");
  const [avg, setAvg] = useState("70000");
  const [addQty, setAddQty] = useState("50");
  const [addPrice, setAddPrice] = useState("60000");

  const calc = useMemo(
    () =>
      calcAveraging({
        qty: toNum(qty),
        avgPrice: toNum(avg),
        addQty: toNum(addQty),
        addPrice: toNum(addPrice),
      }),
    [qty, avg, addQty, addPrice]
  );

  return (
    <CalcShell
      inputs={
        <>
          <NumberField id="av-qty" label="현재 보유 수량" value={qty} onChange={setQty} suffix="주" max={1_000_000_000} />
          <NumberField id="av-avg" label="현재 평단가" value={avg} onChange={setAvg} suffix="원" max={100_000_000} />
          <NumberField id="av-add-qty" label="추가 매수 수량" value={addQty} onChange={setAddQty} suffix="주" max={1_000_000_000} />
          <NumberField id="av-add-price" label="추가 매수가" value={addPrice} onChange={setAddPrice} suffix="원" max={100_000_000} />
        </>
      }
      result={
        <Card>
          <CardContent className="pt-6">
            <dl>
              <ResultRow label="총 보유 수량" value={`${calc.totalQty.toLocaleString("ko-KR")}주`} />
              <ResultRow label="추가 매수 금액" value={won(calc.addCost)} />
              <ResultRow label="총 매수 금액" value={won(calc.totalCost)} />
              <ResultRow label="평단가 변화" value={<span className={tone(calc.hasAdd ? -calc.change : 0)}>{calc.hasAdd ? pct(calc.change) : "-"}</span>} />
              <ResultRow label="변경된 최종 평단가" value={<span className="text-primary">{won(calc.newAvg)}</span>} strong />
            </dl>
            {calc.hasAdd && (
              <p className="mt-4 text-xs text-muted-foreground">
                추가 매수가({won(Number(addPrice))}) 기준으로 본전이 되려면 약 {pct(calc.breakEvenFromAdd)} 오르면 돼요.
              </p>
            )}
          </CardContent>
        </Card>
      }
    />
  );
}
