# FinLearn 인수인계 (2026-10-13)

## 상태 요약
- 브랜치 `main`. 오늘 작업분은 4개 커밋(refactor / test / chore / docs)으로 정리됨. push는 아직 안 함.
- 데이터는 브라우저 localStorage. 인증·DB·그룹 코드는 아직 없음.

## 오늘 끝낸 것
- 뉴스 로직을 `src/lib/news/{parse,classify,summarize,constants}.ts`로 분리, `data/news.ts` 삭제
- `format.ts`를 `src/lib/format.ts`로 이동, 타입을 `src/types/stock.ts`로 통합
- `calculators.ts`, `glossary-validate.ts`, `data/courses.ts`, `data/quiz.ts` 및 타입 분리
- 테스트 추가: calculators, glossary, news, portfolio-storage (총 5파일)
- `.github/workflows/ci.yml` 추가, `package.json`에 `engines.node: 22.x` 추가

## 아직 안 끝낸 것
- 로컬 Node를 20에서 22로 올려야 함 (`.nvmrc`는 22로 추가됨)
- 화살표 변환 예외 케이스 테스트 1건 추가
- 줄바꿈 정책(.gitattributes) 별도 커밋
- push (요청 시 진행, 아직 안 함)

## 검증 결과 (로컬 Node v20.11.1 기준)
| 항목 | 결과 |
|---|---|
| `npm run lint` | 통과 (경고 0) |
| `npx tsc --noEmit` | 통과 |
| `npm test` | 통과 (5 파일, 105 테스트) |
| `npm run build` | 통과 (8 페이지) |

## 남은 안정화 항목
1. **Node 버전 통일 (22 권장)**: 로컬 v20.11.1을 22로 올려야 함. `engines`/CI/README/`.nvmrc`는 22. `@types/node`는 아직 `^20`.
2. **화살표 → "상승했습니다/하락했습니다" 변환**: `toSummarySentence`(`src/lib/news/summarize.ts`). 유지한다면 예외 케이스 테스트 1건 추가 (예: 화살표 앞이 비어 있거나 수치 없이 화살표만 있는 제목).
3. **줄바꿈 정책(.gitattributes) 별도 커밋**: `.gitattributes`는 `* text=auto`뿐이라 Windows에서 LF→CRLF 경고 다수. 오늘은 건드리지 않았음. 기능 변경과 섞지 말 것.
4. **push**: 커밋만 해 둔 상태. 요청 시 진행.

## 다음 단계: 로그인/그룹 시작 전에 정할 것
- 로그인 방식 (이메일/소셜 등)
- 그룹원 공개 범위 (닉네임만 / 수익률 / 보유 종목)
- 퀴즈 보상을 순위에 포함할지
- Auth.js vs Better Auth
- 전제: 전체 랭킹 없이 "그룹 + 주간/월간 순위표(그룹 내부만)", Neon(Postgres) 사용

## 다음 세션 첫 명령
> HANDOFF.md를 읽고 현재 상태부터 알려줘
