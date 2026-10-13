import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INITIAL_CASH } from "@/data/portfolio";

import { won } from "@/lib/format";

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ResetDialog({ open, onOpenChange, onConfirm }: ResetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>투자를 초기화할까요?</DialogTitle>
          <DialogDescription>
            보유 종목과 거래 내역이 모두 삭제되고, 현금 {won(INITIAL_CASH)}으로 다시 시작해요. 되돌릴 수 없어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            초기화
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
