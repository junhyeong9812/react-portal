import { Node } from './node.js';
import { pushLayer, removeLayer } from './layers.js';
import { listen } from './events.js';

// Portal: 논리 부모는 parent, DOM 부모는 target.
// 콘텐츠는 반환된 portal 노드를 parent로 삼아 createNode로 붙이면 된다.
export function createPortal(parent, target = document.body, { on } = {}) {
  const el = document.createElement('div');
  el.className = 'mini-portal';
  // z-index가 적용되려면 positioned 요소여야 한다.
  el.style.position = 'relative';

  const portal = new Node({ el, parent, domParent: target, on });
  portal.isPortal = true;

  pushLayer(el);
  portal.onCleanup(() => removeLayer(el));
  // portal 컨테이너는 루트 DOM 밖이라 루트 리스너가 이벤트를 못 받는다 → 자체 리스너.
  portal.onCleanup(listen(el));
  return portal;
}
