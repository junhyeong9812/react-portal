# log — naive-modal-demo

## 타임라인

| 시각 | 사건 | 결과/결정 |
|------|------|----------|
| 2026-11-04 | 명세 합의, auto. feat/modal-features(PR #2)에 추가 | SPEC=1 |
| 2026-11-04 | A1 스모크 | click 핸들러 안에서 document에 추가한 버블 리스너가 같은 click에 실행됨 → green |
| 2026-11-04 | 구현 + 스모크 | jsdom: N0 정상(메뉴 후 1, Tab 가둠, 위 닫은 뒤 hidden, ESC 1회 후 1) / N1 메뉴 후 0 / N2 열기 직후 0 / N3 Tab 미가둠·ESC 후 0 / N4 위 닫은 뒤 "" — 각 토글이 자기 증상만 재현. 32/32, build OK. src 무변경 |
| 2026-11-04 | 학습 문서 'modal/README.md'에 직접 겪어 보기 절 | 작성 |
| 2026-11-04 | 학습 문서 N1·N2·N3(ESC·Tab)·N4 + frontend/event-capture·overflow | 작성 |
