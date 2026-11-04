import { nodeOf } from './registry.js';

// 오버레이 스택: 모달·메뉴처럼 "맨 위 하나만 키보드·바깥 클릭에 반응해야 하는 것"을 열린 순서대로 쌓는다.
// 맨 뒤가 맨 위. document 리스너는 오버레이가 1개 이상일 때만 붙고, 이벤트는 맨 위 오버레이에게만 간다.
//
// 오버레이 계약:
//   onPointerDown(e, node)  — node = 클릭된 DOM의 논리 노드(없으면 null)
//   onKey(e) → boolean      — true를 돌려주면 "나는 닫혔으니 같은 키를 다음 맨 위에게 넘겨라"
//                             (예: 메뉴에서 Tab → 메뉴를 닫고, 모달의 Tab 가두기가 이어서 처리)
const stack = [];

export function isLogicalDescendant(node, ancestor) {
  for (let n = node; n; n = n.parent) if (n === ancestor) return true;
  return false;
}

export const topOverlay = () => stack[stack.length - 1];

export function getOverlays() {
  return [...stack];
}

// 캡처 단계로 단다: 앱 코드가 stopPropagation해도 먼저 받는다.
// pointerdown을 쓰는 이유: 오버레이를 "여는" 클릭의 pointerdown은 오버레이가 생기기 전에 이미 지나갔으므로
// 여는 클릭이 곧바로 "바깥 클릭"으로 오인되지 않는다(click을 쓰면 오인된다).
function onPointerDown(e) {
  const top = topOverlay();
  if (top) top.onPointerDown(e, nodeOf(e.target));
}

function onKeyDown(e) {
  let top = topOverlay();
  while (top) {
    const passOn = top.onKey(e);
    const next = topOverlay();
    if (!passOn || next === top) return; // 넘기지 않거나, 닫히지 않았으면 끝
    top = next;
  }
}

function attachDocument() {
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
}

function detachDocument() {
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('keydown', onKeyDown, true);
}

export function pushOverlay(overlay) {
  stack.push(overlay);
  if (stack.length === 1) attachDocument();
}

export function removeOverlay(overlay) {
  const i = stack.indexOf(overlay);
  if (i === -1) return;
  stack.splice(i, 1);
  if (stack.length === 0) detachDocument();
}
