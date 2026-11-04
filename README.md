# react-portal — 순수 JS로 만든 미니 Portal

React `createPortal`이 **어떻게 동작하는지** 이해하려고, 의존성 없이 순수 JavaScript로 그 원리를 흉내 낸 학습용 프로젝트입니다.

- DOM은 `body`로 옮겨서 부모의 stacking context·`overflow`에서 벗어나고
- 이벤트 버블링·Context·정리(destroy)는 **원래 부모를 따라** 동작합니다

## 핵심 원리: 트리가 두 개

```
논리 트리 (node.parent)              DOM 트리 (el.parentNode)
root                                 body
 └ card                               ├ #app
    └ portal  ←──── 같은 노드 ────→   │  └ .mini-root
       └ button                       │     └ .card
                                      └ .mini-portal   ← portal만 여기로 이동
                                         └ button
```

| 따르는 트리 | 동작 |
|---|---|
| DOM 트리 | 화면 위치, CSS(stacking context·overflow), 브라우저의 네이티브 이벤트 버블링 |
| 논리 트리 | 컴포넌트 핸들러 실행 순서, Context(`inject`), 정리(`destroy`) |

Portal은 이 두 트리를 의도적으로 가르는 것입니다. 코드에서는 노드를 만들 때 **논리 부모(`parent`)와 DOM을 붙일 곳(`domParent`)을 따로** 받는 한 줄 차이입니다.

### 이벤트는 두 단계로 흐른다

```
[1] 브라우저: 클릭된 요소부터 DOM을 따라 올라가며 리스너 호출
    → 리스너는 루트·portal 컨테이너에 단 dispatch 하나뿐 (이벤트 위임)
[2] dispatch: 클릭된 요소의 노드를 찾고, 논리 부모(n.parent)를 따라 올라가며 핸들러 실행
```

portal 컨테이너는 루트 DOM 밖에 있으므로 portal에도 따로 리스너를 답니다. React 17+도 같은 방식입니다.

## 시작하기

```bash
npm install
npm run dev     # 데모: http://localhost:5173/  · React 비교: /react.html
npm test        # Vitest + jsdom
npm run build   # dist/
```

### 데모에서 볼 것

1. **일반 자식 모달 열기**: 카드의 stacking context·`overflow`·`transform`에 갇혀 잘리고, `z-index: 9999`인데도 헤더 아래로 깔립니다.
2. **Portal 모달 열기**: body로 이동해 화면 전체를 덮습니다.
3. 모달 안 **안쪽 버튼 클릭**: 로그가 `button → portal → card → root` 순서로 찍히지만, `#app`에 직접 단 네이티브 리스너 로그는 찍히지 않습니다. DOM은 옮겨졌고 논리 트리는 유지된다는 증거입니다.
4. **모달 위에 또 열기**: z-index가 1000 → 1001로 쌓이고, 버블링은 `#2 → #1 → card → root`로 올라갑니다.
5. 아래 모달 **닫기**: 위의 모달도 함께 정리됩니다(논리 자식이므로).

### React 비교 페이지 (`/react.html`)

같은 카드(`ThemeContext="dark"` + `onClick`)를 **진짜 portal(`createPortal`)** 과 **가짜 portal(`createRoot`로 별도 렌더)** 로 나란히 보여 줍니다. 두 콘텐츠 모두 DOM은 카드 밖에 있지만, 진짜는 `"dark"`를 읽고 클릭이 카드 `onClick`까지 올라가며, 가짜는 기본값 `"light"`를 읽고 클릭이 카드에 닿지 않습니다. 차이는 DOM이 아니라 React 트리에서 생깁니다. `react`·`react-dom`은 이 페이지와 테스트용 devDependency입니다.

## API

```js
import { createRoot, createNode, createPortal, getLayers, BASE_Z } from './src/index.js';

const root = createRoot(document.getElementById('app'));      // 논리 트리의 루트 + 이벤트 위임
const card = createNode(root, 'div', {                         // 일반 노드: 논리 부모 = DOM 부모
  className: 'card',
  on: { click: (e) => console.log('card', e.target) },
});
card.provide('theme', 'dark');                                 // Context 제공

const portal = createPortal(card);                             // DOM은 body, 논리 부모는 card
const button = createNode(portal, 'button', { text: '닫기' });
button.inject('theme');                                        // 'dark' — portal 경계를 넘어 논리 조상에서 찾음

card.destroy();                                                // portal까지 연쇄 정리 (DOM·레이어·리스너)
```

| 함수 | 설명 |
|---|---|
| `createRoot(container)` | `container` 안에 루트 노드를 만들고 이벤트 위임 리스너를 단다 |
| `createNode(parent, tag?, { on, className, text }?)` | 일반 노드. `on`은 `{ click, input, keydown }` 핸들러 |
| `createPortal(parent, target = document.body, { on }?)` | DOM은 `target`, 논리 부모는 `parent`. 열린 순서대로 z-index(`BASE_Z + i`) |
| `node.provide(key, value)` / `node.inject(key, fallback)` | 논리 트리 기준 Context |
| `node.destroy()` | 논리 자식부터 재귀 정리 → 클린업 역순 실행 → DOM 제거 |
| `getLayers()` | 열린 portal 컨테이너 목록(복사본) |

핸들러가 받는 이벤트 객체는 `{ type, target, currentTarget, nativeEvent, stopPropagation(), preventDefault() }`이며, `target`·`currentTarget`은 DOM 요소가 아니라 **노드**입니다. `stopPropagation()`은 논리 버블링과 네이티브 버블링을 함께 멈춥니다.

## 폴더 구조

```
src/
  node.js       논리 노드 (parent / domParent 분리), createNode, provide·inject, destroy
  portal.js     createPortal
  root.js       createRoot
  events.js     이벤트 위임: listen(등록) + dispatch(논리 트리 배분)
  registry.js   DOM 요소 → 노드 매핑 (WeakMap)
  layers.js     z-index 레이어 스택
  index.js      공개 API
test/           불변식별 테스트 (DOM 이동, 논리 버블링, stopPropagation, 생명주기, Context, 레이어, React 비교)
demo/, index.html   stacking context 함정 vs Portal 대조 데모
demo/react/, react.html   React createPortal vs createRoot 비교 (JSX 없이 createElement)
vite.config.js      멀티 페이지 빌드 (index.html + react.html)
docs/
  learning/pr1/ 코드를 읽으며 정리한 학습 노트 (구조 요약, 개념, Q&A)
  learning/react-compare/ 미니 Portal ↔ React 대응, 가짜 portal이 깨지는 이유
  frontend/     DOM·이벤트·CSS·메모리·클로저 등 주제별 동작 원리
  plans/        작업 명세와 기록
```

## 더 읽기

- [PR #1 학습 노트](docs/learning/pr1/README.md): 코드 읽는 순서, 헷갈렸던 지점과 답
- [React 비교 노트](docs/learning/react-compare/README.md): 미니 구현과 React의 대응표, createRoot 가짜 portal에서 Context·이벤트가 끊기는 이유
- [프론트엔드 기초 주제 문서](docs/frontend/README.md): DOM 트리, 이벤트 흐름·위임, stacking context, containing block, GC, WeakSet, 클로저, 참조와 복사

## 범위와 한계

- 위임하는 이벤트는 `click`, `input`, `keydown`뿐입니다(`src/events.js`의 `EVENT_TYPES`). 다른 타입을 `on`에 넣으면 경고가 뜹니다.
- 레이어는 열린 순서만 봅니다(클릭 시 맨 위로 올리기 없음).
- 학습용 구현이며 실제 서비스용 라이브러리가 아닙니다.
