import type { Metadata } from "next";

import { GlossaryPageView } from "@/components/glossary/glossary-page-view";

export const metadata: Metadata = { title: "용어사전" };

export default function GlossaryPage() {
  return <GlossaryPageView />;
}
