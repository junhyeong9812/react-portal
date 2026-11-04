# 요구사항 명세서 — React createPortal 비교 (4번, 가볍게)

> 작성일: 2026-11-03 · 작업 폴더: `docs/plans/2026-11-03/react-compare/`

## 0. 요구사항 원문 (인터뷰 기록)

- 원문: "다음 작업 3번하고 4번은 가볍게 진행하면 될 꺼 같은데"
- Q/A:
  - 범위 → **비교 페이지 1개 + 테스트 2~3개** (JSX 없이 `createElement`로 작성, 빌드 설정 최소)
  - 브랜치 → 3번과 별도 브랜치 / 모드 → **auto**

## 1. 목표·대상 (필수)

`react.html` 비교 페이지를 추가해 같은 카드 상황을 **진짜 portal(`createPortal`)** 과 **가짜 portal(`createRoot`로 body에 별도 렌더)** 로 나란히 보여 주고, Context·이벤트 차이를 테스트로 확인한다. 브랜치 `feat/react-compare` → PR.

## 2. 경계·불변식 (필수)

- R1 **Context**: 카드가 `ThemeContext = 'dark'`를 제공할 때, 진짜 portal 안 자식은 `'dark'`, 가짜 portal 안 자식은 기본값 `'light'`를 읽는다.
- R2 **이벤트**: portal 안 버튼 클릭 시 카드의 `onClick`이 진짜 portal에서는 호출되고, 가짜 portal에서는 호출되지 않는다.
- R3 **DOM 위치**: 두 경우 모두 콘텐츠의 DOM은 카드 밖(`body` 하위)에 있다 — 차이는 DOM이 아니라 논리 트리.
- 기존 미니 portal 코드·테스트·데모(`index.html`)는 무변경. 기존 테스트 green 유지.
- 의존성: `react`, `react-dom` 추가(최신 안정판). JSX·플러그인 추가 없음.

## 3. 기준소스 (필수)

React 공식 문서 `createPortal`(Context·이벤트는 React 트리 기준) + 이 명세 R1~R3.

## 4. 금지영역 (필수)

- `src/`·`demo/`(기존 파일)·`index.html` 변경 금지(Vite 멀티 페이지 설정과 README 링크 1줄은 허용).
- 3번 모달 작업 혼입 금지. push·PR 생성은 확인 후.

## 5. 검증 방법 (필수)

- `npx vitest run` — R1~R3 테스트(신규 `test/react-compare.test.js`) + 기존 전부 green.
- `npx vite build`가 두 페이지(`index.html`, `react.html`) 모두 산출.
- dev 서버에서 `/react.html` 200 확인.

## 6. stakes (필수)

- 판정: **낮음** — 학습용 비교 페이지, 기존 코드 무변경, devDependency 수준 영향.

## 7. 자율성

- [x] auto

## 8. load-bearing 가정

- A1: Vite 8의 멀티 페이지 빌드 입력 설정 키(`build.rollupOptions.input` 또는 Vite 8 대응 키)를 실제 설치 버전에서 확인하고 두 HTML이 모두 빌드된다. → 착수 직후 스모크.

## 9. task 분해

| task | 목표 | 의존 | acceptance |
|------|------|------|-----------|
| 01 | 의존성 설치 + 멀티 페이지 스모크 | — | build 2페이지 |
| 02 | 비교 컴포넌트 + 페이지 | 01 | dev 200 |
| 03 | R1~R3 테스트 + 학습 문서 | 02 | 테스트 green |

## 승인 상태

- [x] 필수 6칸 전부 기입
- [x] 사용자 합의 → SPEC=1 (2026-11-03, 3개 명세 일괄 합의)
- [x] 자율성 선택 → auto
