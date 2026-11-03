// DOM 엘리먼트 → 논리 노드 매핑.
// 이벤트 위임에서 event.target(DOM)으로부터 "어느 컴포넌트에서 일어났나"를 찾는 다리 역할.
const elToNode = new WeakMap();

export function register(el, node) {
  elToNode.set(el, node);
}

export function unregister(el) {
  elToNode.delete(el);
}

// el에서 DOM을 거슬러 올라가며 가장 가까운 등록 노드를 찾는다.
export function nodeOf(el) {
  for (let cur = el; cur; cur = cur.parentNode) {
    const node = elToNode.get(cur);
    if (node) return node;
  }
  return null;
}
