# 요구사항 명세서 (requirement-spec)

> 작성일: 2026-11-03 · 작업 폴더: `docs/plans/2026-11-03/mini-portal/`

---

## 0. 요구사항 원문 (인터뷰 기록)

- 원문: "리엑트에 포탈이라는게 있다는데 그 동작방식을 심플하게 구현해보려고 하는 프로젝트" / "DOM자체를 JS로 만들고 그 위에 쌓는 방식으로 JS로 동작 구조를 흉내내는건 어떨까?" → 순수 JS + 미니 논리 트리 제안에 "진행해보자."
- Q/A:
  - 범위 → **1+2단계** (1: stacking context 탈출 + z-index 레이어 관리 / 2: 미니 논리 트리로 이벤트 버블링·생명주기). React 비교(3단계)는 이번 범위 밖.
  - 환경 → **Vite + 순수 JS**
  - 검증 → **Vitest + jsdom 테스트** + 데모 페이지 육안 확인(겹침)
  - 이벤트 → **루트 이벤트 위임** (React식: 루트에서 네이티브 이벤트 1개 수신 → 논리 트리 따라 핸들러 호출, stopPropagation 지원)
  - Context → **포함** (provide/inject, 논리 트리 상향 탐색)
  - git → **git init + 단계별 커밋**. 이후 "이닛하고 깃에 올려놓고 이후작업 순차적으로 진행하자" → 원격 확인 Q에 **GitHub public repo 생성 + push**
  - 명세 합의 → **합의** / 모드 → **auto**

---

## 1. 목표·대상 (필수)

`/home/jun/project/react-portal`에 의존성 없는 순수 JS 미니 Portal 라이브러리(`src/`)와 데모 페이지를 만든다. Portal 콘텐츠의 DOM은 대상 컨테이너(`document.body`)로 이동하지만, 이벤트 버블링·Context·생명주기는 **논리 부모**를 따르는 상태가 되면 끝.

## 2. 경계·불변식 (필수)

- I1 **DOM 이동**: Portal 콘텐츠 엘리먼트의 DOM 부모는 target 컨테이너다(논리 부모의 DOM 안에 있지 않다) → 부모의 stacking context·overflow 영향을 받지 않는다.
- I2 **논리 버블링**: Portal 내부에서 발생한 이벤트는 `portal 내부 노드 → portal → 논리 부모 → … → 루트` 순으로 컴포넌트 핸들러를 호출한다. DOM 조상이라도 논리 조상이 아닌 컴포넌트의 핸들러는 호출되지 않는다.
- I3 **stopPropagation**: 핸들러가 `e.stopPropagation()`을 호출하면 그 위 논리 조상 핸들러는 호출되지 않는다.
- I4 **생명주기**: 논리 부모를 destroy하면 하위 Portal의 DOM이 target에서 제거되고, 해당 노드의 핸들러가 더 이상 호출되지 않는다.
- I5 **Context**: `inject(key)`는 가장 가까운 논리 조상이 `provide`한 값을 반환한다(Portal 경계를 넘어서도). 없으면 기본값.
- I6 **레이어**: 나중에 연 Portal의 z-index가 먼저 연 것보다 크다. 닫으면 레이어 스택에서 제거된다.
- 범위 제약: 외부 런타임 의존성 0(devDependencies는 vite·vitest·jsdom만).

## 3. 기준소스 (필수)

React 공식 문서 `createPortal` 동작(DOM은 이동, 이벤트·Context는 React 트리 기준) + 이 명세서의 불변식 I1~I6.

## 4. 금지영역 (필수)

- React·react-dom 등 런타임 의존성 추가 금지(3단계는 범위 밖).
- 원격: 사용자 지시로 **GitHub public repo `react-portal` 생성 + main push 허용**(push마다 승인 UI). 그 외 원격 조작(force push·다른 repo) 금지.
- `.claude/` 하위 상태파일 편집 금지.

## 5. 검증 방법 (필수)

- `npx vitest run` — I1~I6 각각 최소 1개 테스트, 전부 green.
- `npx vite build` 성공.
- 데모 페이지: stacking context 함정(일반 자식 모달이 깔림) vs Portal 모달(위에 뜸) 대조 + 클릭 버블링 로그 표시. dev 서버 실행 확인 후 사용자가 육안 확인.

## 6. stakes (필수)

- 판정: **낮음** — 신규 학습용 프로젝트, 외부 사용자·데이터 없음, 전부 복구 쉬움, 테스트가 불변식을 직접 막음.

---

## 7. 자율성 (모드 — stakes와 별개 축)

- [ ] auto (기본 권장)
- [ ] lazy (학습용 — 매 diff 이해 게이트)

## 8. load-bearing 가정 (1~2개)

- A1: jsdom에서 `document`(루트)에 등록한 리스너가 body 하위 Portal 내부 클릭을 받고, `event.target`에서 DOM을 거슬러 올라가 등록된 노드를 찾을 수 있다(WeakMap el→node). → task 01 직후 스모크 테스트로 실증.

## 9. task 분해

| task | 목표 | 의존 | acceptance |
|------|------|------|-----------|
| 01 | 프로젝트 셋업(git init, Vite, Vitest+jsdom) + A1 스모크 | — | `npx vitest run` green |
| 02 | 1단계: 컴포넌트 노드 + `createPortal`(DOM 이동) + 레이어 매니저(z-index) | 01 | I1·I6 테스트 green |
| 03 | 2단계: 루트 이벤트 위임 + 논리 버블링 + stopPropagation + destroy 연쇄 + provide/inject | 02 | I2~I5 테스트 green |
| 04 | 데모 페이지(함정 vs Portal 대조, 버블링 로그) + build | 03 | `vite build` 성공, dev 서버 기동 |

---

## 승인 상태

- [x] 필수 6칸 전부 기입 (빈 칸 없음)
- [ ] 사용자 합의 → SPEC=1
- [ ] 자율성 선택 → MODE 기록
