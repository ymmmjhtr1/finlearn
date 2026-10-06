import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "용어사전" };

export default function GlossaryPage() {
  return (
    <div className="container flex flex-col items-center gap-4 py-24 text-center">
      <BookOpen className="size-10 text-primary" />
      <h1 className="text-3xl font-bold">용어사전</h1>
      <p className="text-muted-foreground">준비 중입니다. 곧 만나요!</p>
    </div>
  );
}
