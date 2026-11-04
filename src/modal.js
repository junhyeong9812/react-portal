import { createNode } from './node.js';
import { createPortal } from './portal.js';
import { nodeOf } from './registry.js';

// 열린 모달 스택(열린 순서). 맨 뒤가 맨 위 — ESC·바깥 클릭·포커스 가두기는 맨 위에만 반응한다.
const stack = [];

// ── 배경 스크롤 잠금 (참조 카운트) ──
let lockCount = 0;
let savedOverflow = '';

function lockScroll() {
  if (lockCount++ === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}

function unlockScroll() {
  if (--lockCount === 0) document.body.style.overflow = savedOverflow;
}

// ── 논리 트리 판정 ──
function isLogicalDescendant(node, ancestor) {
  for (let n = node; n; n = n.parent) if (n === ancestor) return true;
  return false;
}

const top = () => stack[stack.length - 1];

// ── document 리스너 (모달이 1개 이상일 때만 붙어 있음) ──
// 캡처 단계로 단다: 앱 코드가 stopPropagation해도 먼저 받는다.
// pointerdown을 쓰는 이유: 모달을 "여는" 클릭의 pointerdown은 모달이 생기기 전에 이미 지나갔으므로
// 여는 클릭이 곧바로 "바깥 클릭"으로 오인되지 않는다(click을 쓰면 오인된다).
function onPointerDown(e) {
  const modal = top();
  if (!modal) return;
  const node = nodeOf(e.target);
  // DOM의 contains가 아니라 논리 트리로 판정 → dialog 안에서 연 portal(DOM은 body)도 "안쪽"
  if (node && isLogicalDescendant(node, modal.dialog)) return;
  modal.close('outside');
}

// ponytail: 포커스 순환 범위는 dialog의 DOM 서브트리뿐. dialog 안에서 연 비모달 portal(드롭다운 등)의
// 포커스 요소는 Tab 순환에 포함되지 않는다. 필요하면 논리 자손 portal의 el까지 모아 정렬하도록 확장.
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(modal) {
  return [...modal.dialog.el.querySelectorAll(FOCUSABLE)];
}

function trapTab(e, modal) {
  const dialogEl = modal.dialog.el;
  const items = focusables(modal);
  if (items.length === 0) {
    e.preventDefault();
    dialogEl.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const inside = dialogEl.contains(active);
  // 가장자리에서만 개입한다. 중간 이동은 브라우저 기본 Tab 동작에 맡긴다.
  if (e.shiftKey) {
    if (!inside || active === first || active === dialogEl) {
      e.preventDefault();
      last.focus();
    }
  } else if (!inside || active === last) {
    e.preventDefault();
    first.focus();
  }
}

function onKeyDown(e) {
  const modal = top();
  if (!modal) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    modal.close('escape');
  } else if (e.key === 'Tab') {
    trapTab(e, modal);
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

// 모달: portal → overlay → dialog. 콘텐츠는 반환된 dialog 노드 아래에 createNode로 붙인다.
// onClose(reason): 'outside' | 'escape' | 'close' | 'destroy'(논리 부모가 destroy됨)
export function createModal(parent, { target, onClose, initialFocus, label } = {}) {
  const previousFocus = document.activeElement;

  const portal = createPortal(parent, target);
  const overlay = createNode(portal, 'div', { className: 'mini-modal-overlay' });
  const dialog = createNode(overlay, 'div', { className: 'mini-modal' });
  dialog.el.setAttribute('role', 'dialog');
  dialog.el.setAttribute('aria-modal', 'true');
  dialog.el.tabIndex = -1; // 포커스 가능한 요소가 없을 때 dialog 자체에 포커스
  if (label) dialog.el.setAttribute('aria-label', label);

  let closed = false;
  let reason = 'destroy';

  const modal = {
    portal,
    overlay,
    dialog,
    close(why = 'close') {
      if (closed) return;
      reason = why;
      portal.destroy(); // 정리는 아래 클린업 한 곳에서 — 부모 destroy 경로와 동일
    },
  };

  stack.push(modal);
  if (stack.length === 1) attachDocument();
  lockScroll();

  // 획득한 자원의 해제를 portal 클린업에 예약 → close()든 논리 부모 destroy든 같은 경로로 해제(M5)
  portal.onCleanup(() => {
    closed = true;
    stack.splice(stack.indexOf(modal), 1);
    if (stack.length === 0) detachDocument();
    unlockScroll();
    if (previousFocus?.isConnected) previousFocus.focus();
    onClose?.(reason);
  });

  // 호출한 쪽이 같은 동기 흐름에서 콘텐츠를 다 붙인 뒤에 포커스를 옮긴다.
  queueMicrotask(() => {
    if (closed) return;
    const el = initialFocus?.el ?? focusables(modal)[0] ?? dialog.el;
    el.focus();
  });

  return modal;
}

export function getOpenModals() {
  return [...stack];
}
