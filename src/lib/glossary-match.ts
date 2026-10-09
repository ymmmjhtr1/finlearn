const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 용어 이름들로 텍스트 속 용어를 찾는 정규식(전역). 긴 용어를 먼저 매칭하고, 영문 용어는 단어 경계를 지킨다. */
export function buildTermPattern(names: string[]): RegExp | null {
  const usable = names.filter((n) => n.trim().length >= 2).sort((a, b) => b.length - a.length);
  if (usable.length === 0) return null;
  const parts = usable.map((n) =>
    /^[A-Za-z]+$/.test(n) ? `(?<![A-Za-z])${escape(n)}(?![A-Za-z])` : escape(n)
  );
  return new RegExp(`(${parts.join("|")})`, "g");
}

/** 텍스트에 등장하는 용어 이름(중복 제거, 등장 순) */
export function findMentioned(text: string, pattern: RegExp | null): string[] {
  if (!pattern) return [];
  return Array.from(new Set(text.match(pattern) ?? []));
}
