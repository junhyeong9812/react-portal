# NEXT — 다음 작업 전망

## 기준

- 마지막 갱신: 2026-11-03 · 직전 완료 작업: `docs/plans/2026-11-03/react-compare/` · 기준 커밋: feat/react-compare · 병합 상태: 대기 (모달 PR #2와 별도)

## 다음 작업 후보 (우선순위순)

### N1. 코드 리딩: 모달(3번) → React 비교(4번) — 우선순위: 높음 · 사용자 계획

- **왜 다음인가**: PR #1처럼 코드를 하나씩 읽으며 학습 노트를 쌓는 단계. 입구는 `docs/learning/modal/README.md`, `docs/learning/react-compare/README.md`.
- **착수 전 확인할 것**: PR #2·#3 머지 순서 — 둘 다 main(56609b8)에서 갈라져 `README.md`·`docs/plans/NEXT.md`·`docs/measurement-log.md`를 고쳤으므로 나중에 머지하는 쪽에서 충돌 해소 필요(관측: 두 브랜치 모두 해당 파일 수정).

### N2. 모달 실브라우저 확인 — 우선순위: 중간

- **발생 가능한 문제**: 바깥 `pointerdown`으로 오버레이가 사라진 뒤 같은 클릭의 `click`이 아래 요소로 전달되는지(click-through) — jsdom으로 재현 불가, 미검증(modal-features log ⑥).

## 보류·이월

- (없음)

## 완료 이력

- 완료 → `docs/plans/2026-11-03/react-compare/` (PR 대기)
- 완료 → `docs/plans/2026-11-03/modal-features/` (PR #2 대기)
- 완료 → `docs/plans/2026-11-03/readme/`
- 완료 → `docs/plans/2026-11-03/mini-portal/` (PR #1 머지 e059634)
