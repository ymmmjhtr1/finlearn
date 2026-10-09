"use client";

import { Fragment, useMemo } from "react";

import { useTerms } from "@/components/glossary/term-provider";

/** 텍스트 속 용어사전 단어(기본 + 사용자 추가)를 클릭 가능한 하이라이트로 바꾼다. */
export function TermText({ text }: { text: string }) {
  const { openTerm, pattern } = useTerms();
  const parts = useMemo(() => (pattern ? text.split(pattern) : [text]), [text, pattern]);

  return (
    <>
      {parts.map((part, i) =>
        // split의 캡처 그룹 결과는 홀수 인덱스에 들어온다
        i % 2 === 1 ? (
          <button
            key={i}
            type="button"
            onClick={() => openTerm(part)}
            className="cursor-pointer rounded-sm bg-primary/10 px-0.5 font-medium text-primary underline decoration-dotted underline-offset-2 hover:bg-primary/20 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {part}
          </button>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
