import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = { title: "학습" };

export default function LearnPage() {
  return (
    <div className="container flex flex-col items-center gap-4 py-24 text-center">
      <GraduationCap className="size-10 text-primary" />
      <h1 className="text-3xl font-bold">학습</h1>
      <p className="text-muted-foreground">준비 중입니다. 곧 만나요!</p>
    </div>
  );
}
