"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lightbulb, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GlossaryTerm } from "@/data/mock";
import {
  TermEditorDialog,
  type AddTermResult,
  type NewTermInput,
} from "@/components/glossary/term-editor-dialog";
import { buildTermPattern } from "@/lib/glossary-match";
import {
  buildTerms,
  emptyStore,
  loadStoredGlossary,
  mergeStores,
  normalizeName,
  saveStoredGlossary,
  type StoredGlossary,
} from "@/lib/glossary-storage";


interface TermContextValue {
  /** 기본 용어 + 사용자 추가 용어(사용자 추가분이 앞쪽) */
  terms: GlossaryTerm[];
  /** 텍스트 속 용어를 찾는 정규식 (용어가 바뀌면 함께 갱신됨) */
  pattern: RegExp | null;
  /** 용어 이름으로 상세 모달을 연다. 사전에 없으면 false. */
  openTerm: (name: string) => boolean;
  /** 사용자가 직접 용어를 추가한다. 중복·빈 값은 거절한다. */
  addTerm: (input: NewTermInput) => AddTermResult;
  /** 사용자가 추가한 용어의 삭제 확인창을 연다. 기본 용어는 삭제할 수 없다. */
  requestDelete: (term: GlossaryTerm) => void;
  /** 사용자가 추가한 용어의 편집 다이얼로그를 연다. 기본 용어는 편집할 수 없다. */
  requestEdit: (term: GlossaryTerm) => void;
  /** 카드뉴스에 등장한 용어의 마지막 등장 날짜를 기록한다. (이름 → YYYY-MM-DD) */
  markSeen: (seen: Record<string, string>) => void;
  /** "용어사전 탭에서 더 보기" 동작을 화면(탭)이 등록한다. 해제하려면 null. */
  setViewMoreHandler: (handler: ((term: string) => void) | null) => void;
}

const TermContext = createContext<TermContextValue | null>(null);

export function useTerms() {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTerms는 <TermProvider> 안에서만 사용할 수 있어요.");
  return ctx;
}

const TERM_MAX = 30;
const DEFINITION_MAX = 500;
const EXAMPLE_MAX = 300;

/** 입력값 검증. 통과하면 정리된 값을, 실패하면 오류 문구를 돌려준다. ignoreKey는 편집 중인 자기 자신을 중복 검사에서 빼기 위한 값 */
function validateInput(
  input: NewTermInput,
  terms: GlossaryTerm[],
  ignoreKey?: string
): { ok: true; name: string; definition: string; example: string } | { ok: false; error: string } {
  const name = input.term.trim().replace(/\s+/g, " ");
  const definition = input.definition.trim();
  const example = (input.example ?? "").trim();

  if (name.length < 2) return { ok: false, error: "용어명은 2글자 이상 입력해 주세요." };
  if (name.length > TERM_MAX) return { ok: false, error: `용어명은 ${TERM_MAX}자 이하로 입력해 주세요.` };
  if (!definition) return { ok: false, error: "쉬운 설명을 입력해 주세요." };
  if (definition.length > DEFINITION_MAX)
    return { ok: false, error: `설명은 ${DEFINITION_MAX}자 이하로 입력해 주세요.` };
  if (example.length > EXAMPLE_MAX)
    return { ok: false, error: `예시는 ${EXAMPLE_MAX}자 이하로 입력해 주세요.` };

  const key = normalizeName(name);
  const duplicate = terms.some(
    (t) =>
      normalizeName(t.term) !== ignoreKey &&
      (normalizeName(t.term) === key || (t.english && normalizeName(t.english) === key))
  );
  if (duplicate) return { ok: false, error: `'${name}'은(는) 이미 용어사전에 있어요.` };
  return { ok: true, name, definition, example };
}

export function TermProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // 첫 렌더는 항상 기본 목록(서버와 동일). localStorage는 마운트 후에 합친다 → hydration 안전.
  const [store, setStore] = useState<StoredGlossary>(emptyStore);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<GlossaryTerm | null>(null);
  // 삭제 확인 대기 중인 용어. back이 있으면 취소 시 그 화면(상세 모달/편집창)으로 돌아간다.
  const [pendingDelete, setPendingDelete] = useState<{ term: GlossaryTerm; back: "detail" | "edit" | null } | null>(null);
  // 편집 중인 용어. fromDetail이면 저장/취소 후 상세 모달로 돌아간다.
  const [editing, setEditing] = useState<{ term: GlossaryTerm; fromDetail: boolean } | null>(null);
  const viewMoreRef = useRef<((term: string) => void) | null>(null);

  useEffect(() => {
    const saved = loadStoredGlossary();
    if (saved) setStore((current) => mergeStores(saved, current));
    setLoaded(true);
  }, []);

  // 불러오기가 끝난 뒤의 모든 변경(용어 추가, 뉴스 등장 기록)을 즉시 저장한다.
  useEffect(() => {
    if (loaded) saveStoredGlossary(store);
  }, [loaded, store]);

  // 다른 탭에서 용어를 추가/기록해도 반영
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== "finlearn_glossary_terms") return;
      // 모든 변경은 즉시 저장되므로 병합이 아니라 저장된 값으로 교체한다. (다른 탭의 삭제가 되살아나지 않게)
      setStore(loadStoredGlossary() ?? emptyStore());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const terms = useMemo(() => buildTerms(store), [store]);
  const termKey = terms.map((t) => t.term).join(String.fromCharCode(1));
  // 용어 이름 목록이 같으면(뉴스 등장 날짜만 바뀐 경우) 정규식을 새로 만들지 않는다.
  const pattern = useMemo(
    () => buildTermPattern(termKey.split(String.fromCharCode(1))),
    [termKey]
  );

  const openTerm = useCallback(
    (name: string) => {
      const key = normalizeName(name);
      const found =
        terms.find((t) => normalizeName(t.term) === key) ??
        terms.find((t) => t.english && normalizeName(t.english) === key);
      if (!found) return false;
      setSelected(found);
      return true;
    },
    [terms]
  );

  const addTerm = useCallback(
    (input: NewTermInput): AddTermResult => {
      const v = validateInput(input, terms);
      if (!v.ok) return v;

      const term: GlossaryTerm = {
        term: v.name,
        english: "",
        category: input.category,
        level: "기초",
        definition: v.definition,
        example: v.example,
        analogy: "",
        custom: true,
        addedAt: new Date().toISOString(),
      };
      setStore((s) => ({ ...s, custom: [term, ...s.custom] }));
      return { ok: true };
    },
    [terms]
  );

  /** 사용자가 추가한 용어를 수정한다. 추가 시각(목록 순서)은 유지한다. */
  const editTerm = useCallback(
    (target: GlossaryTerm, input: NewTermInput): AddTermResult => {
      if (!target.custom) return { ok: false, error: "기본 용어는 수정할 수 없어요." };
      const oldKey = normalizeName(target.term);
      const v = validateInput(input, terms, oldKey);
      if (!v.ok) return v;

      const updated: GlossaryTerm = {
        ...target,
        term: v.name,
        category: input.category,
        definition: v.definition,
        example: v.example,
      };
      setStore((s) => {
        const seen = { ...s.seen };
        if (target.term !== v.name) delete seen[target.term]; // 이름이 바뀌면 이전 이름의 등장 기록은 버린다
        return {
          custom: s.custom.map((t) => (normalizeName(t.term) === oldKey ? updated : t)),
          seen,
        };
      });
      return { ok: true };
    },
    [terms]
  );

  const removeTerm = useCallback((target: GlossaryTerm) => {
    // 사용자가 추가한 용어만 삭제할 수 있다. 기본 용어는 저장소에 없으므로 어떤 경우에도 보존된다.
    if (!target.custom) return;
    const key = normalizeName(target.term);
    setStore((s) => {
      const seen = { ...s.seen };
      delete seen[target.term];
      return { custom: s.custom.filter((t) => normalizeName(t.term) !== key), seen };
    });
    setSelected((cur) => (cur && normalizeName(cur.term) === key ? null : cur));
  }, []);

  const requestDelete = useCallback((term: GlossaryTerm) => {
    if (!term.custom) return;
    setPendingDelete({ term, back: null });
  }, []);

  const requestEdit = useCallback((term: GlossaryTerm) => {
    if (!term.custom) return;
    setEditing({ term, fromDetail: false });
  }, []);

  const markSeen = useCallback((seen: Record<string, string>) => {
    setStore((s) => {
      let changed = false;
      const next = { ...s.seen };
      for (const [name, date] of Object.entries(seen)) {
        if (!next[name] || next[name] < date) {
          next[name] = date;
          changed = true;
        }
      }
      return changed ? { ...s, seen: next } : s; // 변화 없으면 같은 객체 → 재렌더/재저장 없음
    });
  }, []);

  const setViewMoreHandler = useCallback((handler: ((term: string) => void) | null) => {
    viewMoreRef.current = handler;
  }, []);

  const value = useMemo(
    () => ({ terms, pattern, openTerm, addTerm, requestDelete, requestEdit, markSeen, setViewMoreHandler }),
    [terms, pattern, openTerm, addTerm, requestDelete, requestEdit, markSeen, setViewMoreHandler]
  );

  function goBackFromDelete(p: { term: GlossaryTerm; back: "detail" | "edit" | null }) {
    if (p.back === "detail") setSelected(p.term);
    if (p.back === "edit") setEditing({ term: p.term, fromDetail: false });
  }

  function viewMore() {
    if (!selected) return;
    const term = selected.term;
    setSelected(null);
    if (viewMoreRef.current) viewMoreRef.current(term);
    else router.push("/"); // 용어사전 탭이 있는 홈으로 이동
  }

  return (
    <TermContext.Provider value={value}>
      {children}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
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
              <Button variant="outline" onClick={viewMore}>
                용어사전 탭에서 더 보기
                <ArrowRight />
              </Button>
              {selected.custom && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing({ term: selected, fromDetail: true });
                    setSelected(null);
                  }}
                >
                  <Pencil />
                  편집
                </Button>
              )}
              {selected.custom && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setPendingDelete({ term: selected, back: "detail" });
                    setSelected(null);
                  }}
                >
                  <Trash2 />
                  단어 삭제
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <TermEditorDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (open || !editing) return;
          // 취소/닫기 시 상세 모달로 복귀. 저장 성공 시에는 onSubmit이 이미 수정본을 열어 두었으므로 그대로 둔다.
          if (editing.fromDetail) setSelected((cur) => cur ?? editing.term);
          setEditing(null);
        }}
        title="용어 편집"
        description="수정한 내용은 바로 저장돼요."
        submitLabel="수정 완료"
        initial={
          editing
            ? {
                term: editing.term.term,
                category: editing.term.category,
                definition: editing.term.definition,
                example: editing.term.example,
              }
            : undefined
        }
        onSubmit={(input) => {
          if (!editing) return { ok: false, error: "편집할 용어를 찾을 수 없어요." };
          const result = editTerm(editing.term, input);
          if (result.ok && editing.fromDetail) {
            // 수정된 내용으로 상세 모달을 다시 연다
            setSelected({
              ...editing.term,
              term: input.term.trim().replace(/\s+/g, " "),
              category: input.category,
              definition: input.definition.trim(),
              example: (input.example ?? "").trim(),
            });
          }
          return result;
        }}
        onDelete={() => {
          if (!editing) return;
          setPendingDelete({ term: editing.term, back: "edit" });
          setEditing(null);
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (open || !pendingDelete) return;
          // 취소(ESC·바깥 클릭·취소 버튼): 상세 모달에서 왔다면 그 모달로 돌아간다.
          goBackFromDelete(pendingDelete);
          setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>&lsquo;{pendingDelete?.term.term}&rsquo; 삭제</DialogTitle>
            <DialogDescription>
              직접 추가한 이 용어를 용어사전에서 삭제할까요? 삭제하면 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingDelete) goBackFromDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDelete) removeTerm(pendingDelete.term);
                setPendingDelete(null);
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TermContext.Provider>
  );
}
