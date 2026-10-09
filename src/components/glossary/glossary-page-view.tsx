"use client";

import { useEffect, useState } from "react";

import { AddTermDialog } from "@/components/glossary/add-term-dialog";
import { useTerms } from "@/components/glossary/term-provider";
import { GlossarySection } from "@/components/home/glossary-section";

export function GlossaryPageView() {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const { setViewMoreHandler } = useTerms();

  // 용어 모달의 "더 보기"는 이 페이지에서는 해당 용어로 검색해 준다.
  useEffect(() => {
    setViewMoreHandler((term) => {
      setQuery(term);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return () => setViewMoreHandler(null);
  }, [setViewMoreHandler]);

  return (
    <div className="container flex flex-col gap-8 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">용어사전</h1>
          <p className="text-muted-foreground">
            어려운 금융 용어를 쉬운 말로 풀어 드려요. 카드뉴스에 나온 용어도 계속 쌓이고, 직접 추가할 수도 있어요.
          </p>
        </div>
        <AddTermDialog
          onAdded={(term) => {
            setQuery(""); // 필터에 가려지지 않게 하고 맨 위에서 바로 보이도록
            setNotice(`'${term}' 용어를 추가했어요. 목록 맨 위에서 확인할 수 있어요.`);
          }}
        />
      </header>
      {notice && (
        <p role="status" className="-mt-4 text-sm text-primary">
          {notice}
        </p>
      )}
      <GlossarySection query={query} onQueryChange={setQuery} />
    </div>
  );
}
