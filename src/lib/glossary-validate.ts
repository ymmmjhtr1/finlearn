import { normalizeName } from "@/lib/glossary-storage";
import type { GlossaryTerm } from "@/types/glossary";

export const TERM_MAX = 30;
export const DEFINITION_MAX = 500;
export const EXAMPLE_MAX = 300;

export interface TermInput {
  term: string;
  definition: string;
  example?: string;
}

export type ValidatedTerm =
  | { ok: true; name: string; definition: string; example: string }
  | { ok: false; error: string };

/** 입력값 검증. 통과하면 정리된 값을, 실패하면 오류 문구를 돌려준다. ignoreKey는 편집 중인 자기 자신을 중복 검사에서 빼기 위한 값 */
export function validateInput(input: TermInput, terms: GlossaryTerm[], ignoreKey?: string): ValidatedTerm {
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
