# NEXT — 다음 작업 전망

## 기준

- 마지막 갱신: 2026-11-04 · 직전 완료 작업: `docs/plans/2026-11-04/menu-keyboard/` · 기준: feat/menu-keyboard (PR #4 대기) · 병합 상태: 프로젝트 마무리 단계

## 다음 작업 후보 (우선순위순)

> 프로젝트는 사용자 판단으로 마무리. 아래는 다시 열 때의 후보(관측 신호 기반).

### N1. 모달 click-through 실브라우저 확인 — 우선순위: 낮음

- **발생 가능한 문제**: 바깥 `pointerdown`으로 오버레이가 사라진 뒤 같은 클릭의 `click`이 뒤쪽 요소로 전달되는지 — jsdom으로 재현 불가, 미검증(modal-features log ⑥). 2026-11-04 사용자 확인 시 관통이 아니라 "맨 위부터 하나씩 닫힘"(정상)으로 정정됨. 확인 방법: 모달 1개만 연 상태에서 "Portal 모달 열기" 버튼이 있던 자리의 배경을 눌러 로그에 `── Portal 모달 열기`가 새로 찍히는지.

## 보류·이월

- (없음)

## 완료 이력

- 완료 → `docs/plans/2026-11-04/menu-keyboard/` (모달 안 메뉴 키보드 — 옛 N2 「Tab 순환에 메뉴 미포함」 해소, PR #4)
- 완료 → `docs/plans/2026-11-04/wrap-up/` (PR #3 충돌 해소·머지)
- 완료 → `docs/plans/2026-11-04/naive-modal-demo/` (PR #2 머지 f0f79f7)
- 완료 → `docs/plans/2026-11-03/react-compare/` (PR #3)
- 완료 → `docs/plans/2026-11-03/modal-features/` (PR #2 머지 f0f79f7)
- 완료 → `docs/plans/2026-11-03/mini-portal/` (PR #1 머지 e059634)
