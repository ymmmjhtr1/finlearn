"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GLOSSARY_CATEGORIES, type GlossaryCategory } from "@/types/glossary";

export interface NewTermInput {
  term: string;
  category: GlossaryCategory;
  definition: string;
  example?: string;
}

export type AddTermResult = { ok: true } | { ok: false; error: string };

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";

interface TermEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  /** 편집 시 미리 채워 둘 값. 없으면 빈 폼 */
  initial?: NewTermInput;
  /** 검증·저장을 맡는다. 실패하면 오류 문구를 폼에 보여주고 창을 유지한다. */
  onSubmit: (input: NewTermInput) => AddTermResult;
  /** 있으면 [삭제] 버튼을 보여준다 (편집 모드) */
  onDelete?: () => void;
}

/** 추가·편집에 함께 쓰는 용어 입력 다이얼로그 */
export function TermEditorDialog({ open, onOpenChange, ...formProps }: TermEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* 닫혀 있을 때는 마운트되지 않으므로, 열릴 때마다 initial 값으로 폼이 새로 채워진다 */}
        <TermForm {...formProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TermForm({
  title,
  description,
  submitLabel,
  initial,
  onSubmit,
  onDelete,
  onClose,
}: Omit<TermEditorDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [term, setTerm] = useState(initial?.term ?? "");
  const [category, setCategory] = useState<GlossaryCategory>(initial?.category ?? "금융상식");
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [example, setExample] = useState(initial?.example ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const result = onSubmit({ term, category, definition, example });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <label htmlFor="term-editor-name" className="text-sm font-medium">
          용어명 <span className="text-destructive">*</span>
        </label>
        <input
          id="term-editor-name"
          value={term}
          maxLength={30}
          onChange={(e) => {
            setTerm(e.target.value);
            setError(null);
          }}
          placeholder="예: 스태그플레이션"
          autoFocus
          className={`${fieldClass} h-10`}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="term-editor-category" className="text-sm font-medium">
          카테고리
        </label>
        <select
          id="term-editor-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as GlossaryCategory)}
          className={`${fieldClass} h-10`}
        >
          {GLOSSARY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="term-editor-definition" className="text-sm font-medium">
          쉬운 설명 <span className="text-destructive">*</span>
        </label>
        <textarea
          id="term-editor-definition"
          value={definition}
          maxLength={500}
          rows={3}
          onChange={(e) => {
            setDefinition(e.target.value);
            setError(null);
          }}
          placeholder="초보자도 이해할 수 있게 풀어서 적어 보세요."
          className={`${fieldClass} py-2`}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="term-editor-example" className="text-sm font-medium">
          실생활 예시 · 추가 팁 <span className="text-muted-foreground">(선택)</span>
        </label>
        <textarea
          id="term-editor-example"
          value={example}
          maxLength={300}
          rows={2}
          onChange={(e) => setExample(e.target.value)}
          className={`${fieldClass} py-2`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter className="sm:justify-between">
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 />
            삭제
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}
