import type { Metadata } from "next";

import { ToolsTabs } from "@/components/tools/tools-tabs";

export const metadata: Metadata = { title: "계산기" };

export default function ToolsPage() {
  return (
    <div className="container flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">금융 계산기</h1>
        <p className="text-muted-foreground">
          숫자를 입력하면 바로 계산돼요. 복리, 예·적금 세후 이자, 물타기 평단가를 직접 확인해 보세요.
        </p>
      </header>
      <ToolsTabs />
    </div>
  );
}
