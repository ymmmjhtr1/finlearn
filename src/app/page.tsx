import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mainNav, siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <>
      <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <Badge variant="secondary">초보자 환영</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          금융, <span className="text-primary">{siteConfig.name}</span>과 함께
          <br />
          쉽게 시작해요
        </h1>
        <p className="max-w-xl text-muted-foreground">{siteConfig.description}</p>
        <Button asChild size="lg">
          <Link href="/learn">
            지금 배우기 <ArrowRight />
          </Link>
        </Button>
      </section>

      <section className="container grid gap-4 pb-20 md:grid-cols-3">
        {mainNav.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <item.icon className="mb-2 size-8 text-primary" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </>
  );
}
