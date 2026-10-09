"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AveragingCalculator,
  CompoundCalculator,
  DepositCalculator,
} from "@/components/tools/calculators";

export function ToolsTabs() {
  return (
    <Tabs defaultValue="compound">
      <TabsList className="grid h-auto w-full grid-cols-3 sm:inline-grid sm:w-auto">
        <TabsTrigger value="compound">복리 계산기</TabsTrigger>
        <TabsTrigger value="deposit">예·적금 이자</TabsTrigger>
        <TabsTrigger value="averaging">평단가(물타기)</TabsTrigger>
      </TabsList>
      <TabsContent value="compound">
        <CompoundCalculator />
      </TabsContent>
      <TabsContent value="deposit">
        <DepositCalculator />
      </TabsContent>
      <TabsContent value="averaging">
        <AveragingCalculator />
      </TabsContent>
    </Tabs>
  );
}
