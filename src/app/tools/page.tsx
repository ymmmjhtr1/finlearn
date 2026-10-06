import type { Metadata } from "next";
import { Calculator } from "lucide-react";

export const metadata: Metadata = { title: "계산기" };

export default function ToolsPage() {
  return (
    <div className="container flex flex-col items-center gap-4 py-24 text-center">
      <Calculator className="size-10 text-primary" />
      <h1 className="text-3xl font-bold">계산기</h1>
      <p className="text-muted-foreground">준비 중입니다. 곧 만나요!</p>
    </div>
  );
}
