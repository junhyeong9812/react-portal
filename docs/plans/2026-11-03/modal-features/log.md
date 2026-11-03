# log — modal-features

## 타임라인

| 시각 | 사건 | 결과/결정 |
|------|------|----------|
| 2026-11-03 | 명세 합의(3개 일괄), auto. feat/modal-features 브랜치(main 56609b8 기준) | log 생성 → 게이트 리셋 후 합의 기준으로 재기록 |
| 2026-11-03 | task01 A1 스모크 | document 캡처 pointerdown·keydown이 앱 stopPropagation 이전에 수신, jsdom PointerEvent 존재 → green |
| 2026-11-03 | task01~03 createModal + test/modal.test.js 15개 | 첫 실행 32/32 green(기존 17 무수정). 변이: 바깥 판정 DOM contains → M1 portal 테스트 1개 실패 / 참조 카운트 제거 → M4 1개 실패 → 복구 32/32 |
| 2026-11-03 | task04 데모 적용 | jsdom 스모크: 열기(overflow hidden, 포커스 안쪽) → ESC(닫힘·포커스 복귀·overflow 복원) / 오버레이 클릭 닫힘 / 메뉴 항목(DOM상 dialog 밖) 클릭 시 유지 / 중첩 z 1000·1001, ESC는 맨 위만. build OK |
| 2026-11-03 | 학습 문서 docs/learning/modal + README 모달 절 | 작성 |
| 2026-11-03 | 머지 전 안전선 | ①스모크(jsdom 데모) ②테스트 32/32 + 변이 2건 ③diff: src는 modal.js 신규 + index.js export 1줄, 기존 src 무변경(금지영역 준수) ④rollback=브랜치 폐기 ⑤public contract: export 2개 추가만 ⑥반증: 실브라우저에서 바깥 pointerdown으로 오버레이가 사라진 뒤 같은 클릭의 click 대상은 jsdom으로 재현 불가 — 미검증, 사용자 실브라우저 확인 요청 |
| 2026-11-03 | 리뷰 | stakes 낮음 → 셀프체크 |
| 2026-11-03 | 아카이브 | CS 이슈 0건(이번 사이클에 실제 발생한 결함 없음) |

## 완료 요약

- `src/modal.js` 신규(createModal·getOpenModals), `test/modal.test.js` 15개, 데모 Portal 모달 교체 + 드롭다운 메뉴, `docs/learning/modal/README.md`, README 모달 절.
- 핵심(실파일 `src/modal.js` onPointerDown에서 복사):

```js
  const node = nodeOf(e.target);
  // DOM의 contains가 아니라 논리 트리로 판정 → dialog 안에서 연 portal(DOM은 body)도 "안쪽"
  if (node && isLogicalDescendant(node, modal.dialog)) return;
  modal.close('outside');
```
- 남은 것: PR 생성·push 확인 대기, 실브라우저 click-through 확인.
