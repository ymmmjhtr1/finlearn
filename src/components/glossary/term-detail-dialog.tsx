"use client";

import { ArrowRight, Lightbulb, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { GlossaryTerm } from "@/types/glossary";

interface TermDetailDialogProps {
  /** 보여줄 용어. null이면 닫힌 상태 */
  term: GlossaryTerm | null;
  onClose: () => void;
  onViewMore: () => void;
  onEdit: (term: GlossaryTerm) => void;
  onDelete: (term: GlossaryTerm) => void;
}

/** 용어 상세 모달 */
export function TermDetailDialog({ term: selected, onClose, onViewMore, onEdit, onDelete }: TermDetailDialogProps) {
  return (
    <Dialog open={selected !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {selected && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap gap-1.5">
                {selected.custom ? (
                  <Badge variant="secondary">내가 추가</Badge>
                ) : (
                  <Badge variant={selected.level === "심화" ? "default" : "secondary"}>
                    {selected.level}
                  </Badge>
                )}
                <Badge variant="outline">{selected.category}</Badge>
                {selected.lastSeenDate && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    뉴스 등장 {selected.lastSeenDate.slice(5).replace("-", "/")}
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{selected.term}</DialogTitle>
              {selected.english && <DialogDescription>{selected.english}</DialogDescription>}
            </DialogHeader>
            <div>
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground">쉬운 설명</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed">{selected.definition}</p>
            </div>
            {selected.analogy && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-950">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold">
                  <Lightbulb className="size-4" />
                  일상 속 비유
                </h3>
                <p className="text-sm leading-relaxed">{selected.analogy}</p>
              </div>
            )}
            {selected.example && (
              <p className="whitespace-pre-line rounded-lg bg-accent p-3 text-sm text-accent-foreground">
                <span className="mr-1 font-semibold">{selected.custom ? "예시·팁" : "실제 예시"}</span>
                {selected.example}
              </p>
            )}
            <Button variant="outline" onClick={onViewMore}>
              용어사전 탭에서 더 보기
              <ArrowRight />
            </Button>
            {selected.custom && (
              <Button variant="outline" onClick={() => onEdit(selected)}>
                <Pencil />
                편집
              </Button>
            )}
            {selected.custom && (
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(selected)}
              >
                <Trash2 />
                단어 삭제
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
