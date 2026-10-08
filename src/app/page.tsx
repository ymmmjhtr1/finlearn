import { Badge } from "@/components/ui/badge";
import { HomeTabs } from "@/components/home/home-tabs";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <>
      <section className="container flex flex-col items-center gap-6 py-14 text-center md:py-20">
        <Badge variant="secondary">초보자 환영</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          금융, <span className="text-primary">{siteConfig.name}</span>과 함께
          <br />
          쉽게 시작해요
        </h1>
        <p className="max-w-xl text-muted-foreground">{siteConfig.description}</p>
      </section>

      <HomeTabs />
    </>
  );
}
