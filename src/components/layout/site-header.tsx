import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/layout/site-nav";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <TrendingUp className="size-6 text-primary" />
          <span className="text-lg">{siteConfig.name}</span>
        </Link>
        <SiteNav />
        <Button asChild size="sm">
          <Link href="/learn">학습 시작</Link>
        </Button>
      </div>
    </header>
  );
}
