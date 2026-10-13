# FinLearn

**금융 초심자를 위한 카드뉴스 & 실시간 모의투자 학습 플랫폼**

어려운 경제 뉴스는 카드뉴스로 쉽게 읽고, 실제 시세로 모의투자를 해 보며 금융을 직접 체험하는 학습 서비스입니다.

🔗 **라이브 데모**: https://finlearn-opal.vercel.app

---

## 핵심 기능

### 1. 경제 뉴스 카드뉴스 & 핵심 요약
경제 뉴스 RSS를 실시간으로 가져와 카드뉴스 형태로 보여주고, 기사별 핵심을 요약해 초심자도 흐름을 빠르게 파악할 수 있습니다.

### 2. 실시간 모의투자
Yahoo Finance API의 실제 시세로 매수·매도를 연습합니다.
- 거래 수수료 · 증권거래세 반영 여부를 토글로 선택
- 자산 배분 도넛 차트로 현금·종목별 비중 확인
- 총 자산, 평가손익, 수익률, 거래 내역 제공
- 시드머니 1,000만 원으로 시작, 초기화 가능

### 3. 사용자 정의 금융 용어사전
- 용어 검색 및 등록·수정
- 로컬스토리지 기반 영구 보관 (새로고침해도 유지)

### 4. 금융 계산기 & 퀴즈
- 학습에 필요한 금융 계산기
- 일일 퀴즈로 개념 복습

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui (Radix UI) |
| Data | Yahoo Finance API (`yahoo-finance2`), 경제 뉴스 RSS (`fast-xml-parser`) |
| Chart | Recharts |
| Deploy | Vercel |

## 구조적 개선 사항

대형 단일 컴포넌트였던 모의투자 화면을 책임별로 분리해 유지보수성과 테스트 용이성을 높였습니다.

- **컴포넌트 모듈화**: 약 770줄이던 `portfolio-section.tsx`를 요약 카드, 보유 종목 표, 시장 표, 거래 내역, 체결·초기화 다이얼로그로 분리하고 본문은 약 150줄의 조합(Orchestration) 역할만 담당
- **`useReducer` 단일 상태 관리**: 현금·보유 종목·거래 내역·수수료 토글을 하나의 reducer로 통합해 체결, 초기화, 토글을 원자적으로 갱신
- **관심사 분리**: 시세 조회(`useLiveQuotes`), 포트폴리오 상태(`usePortfolio`), 금액·수수료 계산(`lib/portfolio-calc.ts` 순수 함수)을 UI와 독립적으로 구성
- **일관된 체결 계산**: 주문 미리보기와 실제 체결이 같은 `quoteTrade` 계산을 사용하고, 체결 시 reducer가 최신 상태로 재검증
- **스토리지 다중 탭 동기화**: `storage` 이벤트로 다른 탭의 변경을 반영해 오래된 상태가 최신 데이터를 덮어쓰지 않도록 처리
- **저장 데이터 검증**: localStorage 값을 불러올 때 형식을 검증해 손상된 데이터로부터 보호

## 프로젝트 구조

```
src/
├── app/                    # 라우트(홈·학습·도구·용어사전) 및 API (/api/news, /api/stocks)
├── components/
│   ├── home/portfolio/     # 모의투자 UI 컴포넌트
│   └── ...                 # 용어사전, 계산기, 퀴즈 등
├── hooks/                  # use-portfolio, use-live-quotes
├── lib/                    # 순수 계산 로직, 저장소 처리
└── data/                   # 종목·용어 등 정적 데이터
```

## 로컬 실행 방법

### 사전 준비
- Node.js 22 (`yahoo-finance2` 요구 사항, `package.json`의 `engines`와 CI도 22 기준)
  - Vercel 배포 시 **Project Settings → General → Node.js Version**도 `22.x`로 맞춰야 해요.
- npm

### 실행

```bash
git clone https://github.com/ymmmjhtr1/finlearn.git
cd finlearn
npm install
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 기타 스크립트

```bash
npm run lint        # ESLint 검사
npx tsc --noEmit    # 타입 검사
npm test            # 단위 테스트 (Vitest)
npm run build       # 프로덕션 빌드
npm run start       # 빌드 결과 실행
```

## 유의 사항

- 모의투자는 가상의 시드머니로 진행되며 실제 거래가 아닙니다.
- 시세는 Yahoo Finance 기준이며 장 마감·휴장 시에는 직전 거래일 종가, 일부 지연이 있을 수 있습니다.
