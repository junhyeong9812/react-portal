# 요구사항 명세서 — 모달 실무 기능 (3번)

> 작성일: 2026-11-03 · 작업 폴더: `docs/plans/2026-11-03/modal-features/`

## 0. 요구사항 원문 (인터뷰 기록)

- 원문: "서버도 종료하고 그 다음, 해당 프로젝트의 리드미 적고 다음 작업 3번하고 4번은 가볍게 진행하면 될 꺼 같은데"
- Q/A:
  - 기능 → **바깥 클릭 시 닫기, ESC로 맨 위 모달만 닫기, 포커스 가두기 + 복귀, 배경 스크롤 잠금** (4개 전부)
  - 위치 → **라이브러리에 추가** (`src/modal.js`, 테스트로 검증, 데모가 사용, 기존 `createPortal` 유지)
  - 바깥 클릭 정의 → **논리 트리 바깥** (중첩 모달·portal 포함 판정, 오버레이 클릭 포함)
  - 브랜치 → "3번과 4번은 각각 브랜치를 나눠서 진행" / 모드 → **auto**

## 1. 목표·대상 (필수)

`src/modal.js`에 `createModal(parent, options)`를 추가해 바깥 클릭·ESC·포커스 가두기/복귀·스크롤 잠금을 제공하고, 데모의 Portal 모달이 이를 사용하게 한다. 브랜치 `feat/modal-features` → PR.

## 2. 경계·불변식 (필수)

- 구조: `portal → overlay → dialog`(`role="dialog"`, `aria-modal="true"`). 콘텐츠는 `dialog` 노드 아래에 붙인다.
- M1 **바깥 클릭**: `pointerdown`의 시작 노드가 **맨 위 모달의 dialog 노드의 논리 자손이 아니면** 그 모달만 닫는다. 오버레이 클릭은 바깥. dialog 안에서 연 portal(DOM은 dialog 밖)의 클릭은 **바깥 아님**.
- M2 **ESC**: 맨 위 모달 하나만 닫는다. 열린 모달이 없으면 아무 일도 없다.
- M3 **포커스**: 열면 dialog 안으로 포커스 이동. Tab/Shift+Tab은 dialog DOM 안의 포커스 가능 요소 사이에서 순환. 닫으면 열기 전 포커스 요소로 복귀(문서에 남아 있을 때).
- M4 **스크롤 잠금**: 모달이 1개 이상 열려 있는 동안 `body.style.overflow = 'hidden'`. 마지막 모달이 닫히면 원래 값으로 복원(중첩 시 참조 카운트).
- M5 **정리 일관성**: 모달의 논리 부모를 destroy해도 M1~M4 자원(모달 스택·스크롤 잠금·document 리스너)이 전부 해제된다. 모달이 0개면 document 리스너도 0개.
- M6 **기존 계약 보존**: 기존 테스트 17개 무수정 green, `createPortal`·`createNode`·`createRoot` 시그니처 불변.
- 범위 제약: 런타임 의존성 추가 없음.

## 3. 기준소스 (필수)

이 명세의 M1~M6 + WAI-ARIA Authoring Practices의 Dialog(Modal) 패턴(포커스 이동·Tab 순환·ESC·복귀).

## 4. 금지영역 (필수)

- 기존 `src/node.js`·`src/events.js`·`src/portal.js`·`src/layers.js`의 동작 변경 금지(필요해지면 멈추고 보고). `index.js` export 추가는 허용.
- 4번(React) 작업 혼입 금지. push·PR 생성은 확인 후.

## 5. 검증 방법 (필수)

- `npx vitest run` — M1~M5 각 최소 1개 테스트(신규 `test/modal.test.js`) + 기존 17개 green.
- 변이 점검 1회: 바깥 판정을 DOM `contains`로 바꾸면 M1의 "dialog 안 portal" 테스트가 실패하는지.
- `npx vite build` 성공, jsdom 데모 스모크(열기→ESC·바깥 클릭 닫기).

## 6. stakes (필수)

- 판정: **낮음** — 학습용 프로젝트, 신규 모듈 추가, 기존 API 불변, 복구 쉬움.

## 7. 자율성

- [x] auto

## 8. load-bearing 가정

- A1: document에 **캡처 단계**로 단 `pointerdown`·`keydown` 리스너가 jsdom에서 동작하고, 모달을 연 클릭의 `pointerdown`은 모달 생성 전에 이미 지나가서 "바깥 클릭"으로 오인되지 않는다. → 착수 직후 스모크.

## 9. task 분해

| task | 목표 | 의존 | acceptance |
|------|------|------|-----------|
| 01 | A1 스모크 + `createModal` 골격(구조·모달 스택·close) | — | 스모크 green |
| 02 | M1 바깥 클릭 · M2 ESC | 01 | 테스트 green |
| 03 | M3 포커스 · M4 스크롤 잠금 · M5 정리 | 02 | 테스트 green |
| 04 | 데모 적용 + build + 학습 문서 | 03 | build 성공, 스모크 |

## 승인 상태

- [x] 필수 6칸 전부 기입
- [x] 사용자 합의 → SPEC=1 (2026-11-03, 3개 명세 일괄 합의)
- [x] 자율성 선택 → auto
