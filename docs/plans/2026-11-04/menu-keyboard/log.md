# log — menu-keyboard

## 타임라인

| 시각 | 사건 | 결과/결정 |
|------|------|----------|
| 2026-11-04 | 명세 합의, auto. feat/menu-keyboard 브랜치(main 1504ff0 기준) | log 생성 → 게이트 재기록 |
| 2026-11-04 | overlay-stack.js 분리 + modal.js 이전 | 기존 38/38 그대로 green(K8) |
| 2026-11-04 | menu.js createMenu + test/menu.test.js 11개 | 49/49 green. 변이: 키 디스패치를 "맨 위 모달"로 → K2·K3·K5 3개 실패 → 복구 49/49 |
| 2026-11-04 | 데모 toggleMenu → createMenu | jsdom 스모크: 열면 '메뉴 항목' 포커스 · ↓ '항목 2' · ESC 메뉴만(모달 1, 포커스 메뉴 열기) · 항목 3 선택 후 복귀 · Tab 메뉴 닫힘 포커스 메뉴 열기 · N1 토글 재현 유지(모달 0). build OK |
| 2026-11-04 | 낡은 "Tab 순환 한계" 서술 정리(사용자는 새 문서 N5는 원치 않음 — 기존 서술의 사실 오류만 수정) | n3-tab-trap 「해소」 절 추가·제목 정정, modal README 해소 표기, NEXT 옛 N2 제거→완료 이력, README API·폴더·데모 8 추가 |
| 2026-11-04 | 사용자 실브라우저 확인: 메뉴 열기 → ↓ → ESC(메뉴만 닫힘) → 재오픈 → Tab(메뉴 닫힘, "모달 위에 또 열기"로 포커스) | 통과 → PR #4 머지 |
