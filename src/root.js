import { Node } from './node.js';

// 논리 트리의 루트. container 안에 자기 엘리먼트를 하나 만들어 붙인다.
export function createRoot(container) {
  const el = document.createElement('div');
  el.className = 'mini-root';
  return new Node({ el, domParent: container });
}
