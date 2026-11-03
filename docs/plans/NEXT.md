# NEXT — 다음 작업 전망

## 기준

- 마지막 갱신: 2026-11-03 · 직전 완료 작업: `docs/plans/2026-11-03/modal-features/` · 기준 커밋: feat/modal-features · 병합 상태: 대기

## 다음 작업 후보 (우선순위순)

### N1. React createPortal 비교 (가볍게) — 우선순위: 중간 · 명세 합의 완료 (`docs/plans/2026-11-03/react-compare/`)

- **왜 다음인가**: 미니 구현의 불변식을 React 실제 동작과 대조. `createRoot` 가짜 portal로 Context·이벤트 끊김 확인.
- **발생 가능한 문제**: 미니 구현은 portal 컨테이너마다 리스너를 달고 `handled` WeakSet으로 중복을 막는다(`src/events.js`). React와 이벤트 순서·네이티브 stopPropagation 효과를 비교할 때 이 차이가 결과에 드러난다.
- **착수 전 확인할 것**: Vite 8 멀티 페이지 설정 키(명세 A1).

## 보류·이월

- (없음)

## 완료 이력

- 완료 → `docs/plans/2026-11-03/modal-features/` (PR 대기)
- 완료 → `docs/plans/2026-11-03/readme/`
- 완료 → `docs/plans/2026-11-03/mini-portal/` (PR #1 머지 e059634)
