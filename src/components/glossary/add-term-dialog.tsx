"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TermEditorDialog } from "@/components/glossary/term-editor-dialog";
import { useTerms } from "@/components/glossary/term-provider";

interface AddTermDialogProps {
  /** 추가에 성공하면 추가된 용어명을 알려준다 (목록 상단에서 바로 보이도록 검색어 초기화 등에 사용) */
  onAdded?: (term: string) => void;
}

export function AddTermDialog({ onAdded }: AddTermDialogProps) {
  const { addTerm } = useTerms();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        단어 추가
      </Button>
      <TermEditorDialog
        open={open}
        onOpenChange={setOpen}
        title="나만의 용어 추가"
        description="직접 추가한 용어는 이 브라우저에 저장되고, 용어사전 맨 위에 표시돼요."
        submitLabel="저장"
        onSubmit={(input) => {
          const result = addTerm(input);
          if (result.ok) onAdded?.(input.term.trim());
          return result;
        }}
      />
    </>
  );
}
