import { nodeOf } from './registry.js';

// React처럼 개별 엘리먼트가 아니라 "컨테이너"에 네이티브 리스너를 단다.
// 루트 컨테이너 + 각 portal 컨테이너(portal은 루트 DOM 밖에 있으므로 따로 필요).
export const EVENT_TYPES = ['click', 'input', 'keydown'];

// 같은 네이티브 이벤트가 중첩된 컨테이너(예: portal target이 루트 안)에서
// 두 번 디스패치되지 않도록 표시한다.
const handled = new WeakSet();

function dispatch(native) {
  if (handled.has(native)) return;
  handled.add(native);

  const start = nodeOf(native.target);
  if (!start) return;

  let stopped = false;
  const event = {
    type: native.type,
    nativeEvent: native,
    target: start,
    currentTarget: null,
    stopPropagation() {
      stopped = true;
      native.stopPropagation();
    },
    preventDefault() {
      native.preventDefault();
    },
  };

  // 핵심: DOM 부모가 아니라 논리 부모(n.parent)를 따라 올라간다.
  for (let n = start; n && !stopped; n = n.parent) {
    const handler = n.handlers[native.type];
    if (handler) {
      event.currentTarget = n;
      handler(event);
    }
  }
}

// container에 위임 리스너를 달고, 해제 함수를 돌려준다.
export function listen(container) {
  for (const type of EVENT_TYPES) container.addEventListener(type, dispatch);
  return () => {
    for (const type of EVENT_TYPES) container.removeEventListener(type, dispatch);
  };
}
