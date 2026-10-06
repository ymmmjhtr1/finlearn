import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="container space-y-2 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
        <p>
          본 서비스는 교육 목적으로 제공되며, 특정 금융상품의 투자 권유가
          아닙니다.
        </p>
      </div>
    </footer>
  );
}
