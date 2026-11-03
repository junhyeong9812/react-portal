# log — 라이브 타임라인 + 리뷰 ledger

## 타임라인

| 시각 | 사건 | 결과/결정 |
|------|------|----------|
| 2026-11-03 | 인터뷰 완료 → spec 작성 → 사용자 합의 | SPEC=1, MODE=auto. 원격: GitHub public repo 생성 + push 추가 지시 |
| 2026-11-03 | task01 셋업 + A1 스모크 | green(1/1). 86a4051 커밋 → gh public repo 생성 + main push. 이후 feat/mini-portal 브랜치 |
| 2026-11-03 | task02 노드·portal·레이어 | I1·I6 테스트 6개 green(전체 7/7) |
| 2026-11-03 | task03 이벤트 위임·Context·destroy 연쇄 | I2~I5 테스트 9개 green(전체 16/16). 변이 점검: 버블링을 DOM 기준으로 바꾸면 I2 4개 실패 확인 → 복구 |
| 2026-11-03 | task04 데모 + build | vite build 성공, dev 서버 200. jsdom 데모 스모크: 일반 모달은 card 안, portal 2개 z=1000/1001, #2→#1→card→root 버블링, #1 닫기 시 0개. fixed+overflow 비클리핑 발견 → card에 transform 추가로 데모 정정 |
| 2026-11-03 | 반증 점검: EVENT_TYPES 밖 핸들러가 무음으로 미호출 | Node 생성 시 console.warn + 테스트 추가. 17/17 green, build OK |
| 2026-11-03 | 머지 전 안전선 | ①스모크(jsdom 데모+dev 200) ②테스트 17/17+변이 점검 ③diff self-review(의도 외 변경 없음) ④rollback=브랜치 폐기 ⑤public contract 없음(신규) ⑥반증: 미지원 이벤트 무음 실패 → 수정 |
| 2026-11-03 | 리뷰 | stakes 낮음 → 셀프체크(강도표). 듀얼 리뷰 비대상 |
| 2026-11-03 | 브랜치 push + PR | https://github.com/junhyeong9812/react-portal/pull/1 (base main) |
| 2026-11-03 | 아카이브 | CS 이슈 1건(fixed 자손·overflow·transform containing block). 원 식별자: react-portal, demo/style.css .card. 기존 카드 issue/typescript/react/css-containing-context ⓑ 동일 원리·동일 해결(body 포털) — 무변경, 커밋 없음 |

## 리뷰 ledger (中↑ — 듀얼 리뷰가 돈 작업 필수)

- 비대상(stakes 낮음 — 셀프체크)

## 생략한 검증

- 없음 (DEBT=0)

## 완료 요약

- **무엇이 됐나**: 의존성 0 순수 JS 미니 Portal(`src/` 6파일) + Vitest 17개(I1~I6) + 대조 데모(`index.html`, `demo/`). 브랜치 `feat/mini-portal` 커밋 4개(d76cf08·3a7d496·e4ee6e5·dcbb229), main에는 셋업 86a4051만 push됨.
- **핵심 코드** (실파일 `src/events.js:33-39` 복사 — Opus 워커 위임은 생략: 신규 파일만이라 before가 없고 규모가 작음):

```js
  // 핵심: DOM 부모가 아니라 논리 부모(n.parent)를 따라 올라간다.
  for (let n = start; n && !stopped; n = n.parent) {
    const handler = n.handlers[native.type];
    if (handler) {
      event.currentTarget = n;
      handler(event);
    }
```

- `src/portal.js`: `new Node({ el, parent, domParent: target, on })` — 논리 부모와 DOM 부모의 분리가 Portal 전체. portal 컨테이너는 루트 DOM 밖이라 자체 위임 리스너(`portal.onCleanup(listen(el))`)가 필요 — React 17+가 portal 컨테이너에도 리스너를 다는 것과 같은 이유.
- **배운 것**: `position: fixed` 자손은 조상의 `overflow: hidden`에 잘리지 않는다 — 조상에 `transform`이 있을 때만 그 조상이 containing block이 되어 잘린다(데모 정정 근거).
- **남은 것**: PR #1 머지 대기. 3단계(React createPortal 비교)는 범위 밖.
