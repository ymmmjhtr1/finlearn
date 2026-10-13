"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GlossaryTerm } from "@/types/glossary";

/** 삭제 확인 대기 중인 용어. back이 있으면 취소 시 그 화면(상세 모달/편집창)으로 돌아간다. */
export interface PendingDelete {
  term: GlossaryTerm;
  back: "detail" | "edit" | null;
}

interface DeleteTermDialogProps {
  pending: PendingDelete | null;
  /** 취소(ESC·바깥 클릭·취소 버튼) */
  onCancel: (pending: PendingDelete) => void;
  onConfirm: (pending: PendingDelete) => void;
}

/** 사용자가 추가한 용어의 삭제 확인 모달 */
export function DeleteTermDialog({ pending, onCancel, onConfirm }: DeleteTermDialogProps) {
  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (open || !pending) return;
        onCancel(pending);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>&lsquo;{pending?.term.term}&rsquo; 삭제</DialogTitle>
          <DialogDescription>
            직접 추가한 이 용어를 용어사전에서 삭제할까요? 삭제하면 되돌릴 수 없어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => pending && onCancel(pending)}>
            취소
          </Button>
          <Button variant="destructive" onClick={() => pending && onConfirm(pending)}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
