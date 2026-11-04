# log — react-compare

## 타임라인

| 시각 | 사건 | 결과/결정 |
|------|------|----------|
| 2026-11-04 | 명세 합의(2026-11-03 3개 일괄), auto. feat/react-compare 브랜치(main 56609b8 기준, 모달 PR #2와 분리) | log 생성 → 게이트 재기록 |
| 2026-11-04 | task01 의존성 + A1 스모크 | react·react-dom 19.3.1(2026-10-14 배포). Vite 8은 build.rolldownOptions(rollupOptions deprecated) → 임시 react.html로 2페이지 빌드 확인 |
| 2026-11-04 | task02~03 비교 컴포넌트·페이지·테스트 | 23/23 green(기존 17 + R 6), React 경고 없음. 변이: 가짜를 RealPortal로 바꾸면 R1·R2 가짜 테스트 2개 실패 → 복구 23/23 |
| 2026-11-04 | 스모크 | build 2페이지, dev 200(/react.html, deps 사전번들), jsdom 전체 페이지: real "dark"·Card onClick 도달 / fake "light"·Card 미도달, 두 box 모두 target 안. 관찰: fake에서도 버튼 onClick은 동작(prop 클로저) |
| 2026-11-04 | 머지 전 안전선 | ①스모크(build·dev·jsdom 페이지) ②23/23 + 변이 1건 ③diff: src·index.html·기존 demo 무변경(금지영역 준수), vite.config.js 신규 ④rollback=브랜치 폐기 ⑤public contract 없음(devDependency만) ⑥반증: PR #2와 README·NEXT·측정로그 동시 수정 → 후순위 머지 시 충돌 예상(NEXT N1 기록) |
| 2026-11-04 | 리뷰 | stakes 낮음 → 셀프체크 |
| 2026-11-04 | 아카이브 | CS 이슈 0건(실제 발생 결함 없음. 관찰한 "렌더 중 다른 루트 동기 unmount 경고 회피"는 예방 코드이며 사건 아님) |

## 완료 요약

- `react.html` + `demo/react/{compare,main}.js` + `test/react-compare.test.js`(R1~R3, 6개) + `vite.config.js`(rolldownOptions 멀티 페이지) + `docs/learning/react-compare/README.md` + README 절.
- 핵심(실파일 `demo/react/compare.js`에서 복사):

```js
export function RealPortal({ children, container }) {
  return createPortal(children, container);
}
```
- 남은 것: push·PR 확인 대기, PR #2와 README 충돌 해소.
| 2026-11-04 | push + PR | PR #3 생성 |
