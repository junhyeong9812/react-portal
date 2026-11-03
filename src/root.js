import { Node } from './node.js';
import { listen } from './events.js';

// 논리 트리의 루트. container 안에 자기 엘리먼트를 하나 만들어 붙이고,
// 그 엘리먼트에 이벤트 위임 리스너를 단다.
export function createRoot(container) {
  const el = document.createElement('div');
  el.className = 'mini-root';
  const root = new Node({ el, domParent: container });
  root.onCleanup(listen(el));
  return root;
}
