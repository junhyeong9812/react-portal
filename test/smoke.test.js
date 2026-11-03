// A1: 루트(document)에 등록한 리스너 하나가 body 하위 깊은 곳의 클릭을 받고,
// event.target에서 DOM을 거슬러 올라가 WeakMap에 등록된 엘리먼트를 찾을 수 있다.
import { test, expect } from 'vitest';

test('A1: document 리스너 + WeakMap 상향 탐색', () => {
  const registry = new WeakMap();
  const container = document.createElement('div');
  const inner = document.createElement('span');
  container.appendChild(inner);
  document.body.appendChild(container);
  registry.set(container, 'node-A');

  let found = null;
  const listener = (e) => {
    for (let el = e.target; el; el = el.parentNode) {
      if (registry.has(el)) { found = registry.get(el); break; }
    }
  };
  document.addEventListener('click', listener);
  inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  document.removeEventListener('click', listener);
  container.remove();

  expect(found).toBe('node-A');
});
