# Memory & Cleanup

> **한 줄**: JS는 **도달할 수 없는** 객체만 GC가 회수한다. 객체가 사라질 때 자동으로 호출되는 소멸자는 없다. 그래서 리스너·타이머·전역 목록 등록은 **명시적으로 해제**해야 한다.

## GC가 실제로 하는 일

- 전역 변수, 현재 실행 중인 함수의 변수 등 **루트**에서 출발해 참조를 따라간다.
- 도달할 수 있으면 살아 있고, 도달할 수 없으면 회수한다(mark-and-sweep).
- **언제** 회수할지는 엔진이 정한다. 회수 시점에 우리 코드가 불리지 않는다.

```js
let el = document.createElement('div');
document.body.appendChild(el);
el.remove();          // DOM에서는 빠졌지만
                      // 변수 el이 아직 참조 중 → 회수 안 됨
el = null;            // 이제 아무도 참조 안 함 → 회수 대상
```

## 누수가 생기는 패턴

**오래 사는 것이 짧게 살아야 할 것을 붙잡고 있을 때** 누수가 된다.

| 오래 사는 쪽 | 붙잡히는 것 | 예 |
|---|---|---|
| 전역 배열·Map | 지운 DOM 요소 | 레이어 스택에 닫은 모달이 남음 |
| `window`/`document` 리스너 | 그 리스너 함수가 클로저로 잡은 컴포넌트 | 언마운트 후에도 resize 리스너가 살아 있음 |
| `setInterval` | 콜백이 잡은 상태 | 화면을 떠나도 계속 실행 |
| 캐시 Map | 키로 쓴 객체 | 일반 Map이라 영원히 남음 |

## WeakMap / WeakSet

> 자세히: [weak-collections.md](weak-collections.md)

- 키를 **약하게** 참조한다. 키 객체가 다른 곳에서 안 쓰이면, WeakMap에 들어 있어도 회수된다.
- 키는 객체만 가능하고, 순회(`forEach`, `size`)가 안 된다. 언제 사라질지 모르기 때문.
- 용도: **객체에 부가 정보를 붙이되, 그 객체의 수명에는 관여하지 않을 때.**

```js
const meta = new WeakMap();
meta.set(el, { node });   // el이 사라지면 이 항목도 같이 사라질 수 있음
```

## 정리 패턴: 획득한 곳에서 해제를 예약

```js
// 해제 함수를 돌려주는 등록 함수
function listen(target, type, fn) {
  target.addEventListener(type, fn);
  return () => target.removeEventListener(type, fn);
}

const cleanups = [];
cleanups.push(listen(window, 'resize', onResize));       // 획득 + 해제 예약
const id = setInterval(tick, 1000);
cleanups.push(() => clearInterval(id));

// 정리 시: 역순(스택)으로
for (const fn of cleanups.splice(0).reverse()) fn();
```

- React `useEffect`의 return 함수가 정확히 이 패턴이다.
- 역순인 이유: 나중에 설치한 것이 먼저 설치한 것에 의존할 수 있으므로 거꾸로 걷어내는 게 안전하다.
- C++ RAII와 같은 발상(자원 획득 = 해제 책임).

## 이 프로젝트에서

- `src/registry.js` — `WeakMap`으로 el → node. registry가 el을 붙잡지 않는다.
- `src/events.js:9` — `WeakSet`으로 처리한 이벤트 표시. 이벤트 객체가 끝나면 함께 사라진다.
- `src/layers.js`의 `stack` — **일반 배열**이라 el을 붙잡는다 → 그래서 `removeLayer`로 반드시 빼야 한다.
- `src/node.js:49` `destroy()` — 자식 재귀 → 클린업 역순 실행 → registry 해제 → 부모에서 분리 → DOM 제거.
- `src/portal.js` — `pushLayer` 옆에 `removeLayer` 예약, `listen` 결과(해제 함수)를 바로 예약.

## 흔한 함정

- **"DOM에서 지웠으니 끝"**: 배열·Map·리스너가 참조하면 남는다.
- **익명 함수로 등록해서 해제 불가**: 해제 함수를 등록 시점에 만들어 둔다.
- **WeakMap에 원시값 키**: 문자열·숫자는 키로 못 쓴다.
- **확인 방법**: 개발자 도구 Memory 탭의 Heap snapshot에서 "Detached" 요소 검색.
