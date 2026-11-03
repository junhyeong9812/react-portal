import { Node } from './node.js';
import { pushLayer, removeLayer } from './layers.js';

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
  return portal;
}
