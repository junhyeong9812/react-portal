import { createNode } from './node.js';
import { createPortal } from './portal.js';
import { pushOverlay, removeOverlay, getOverlays, isLogicalDescendant } from './overlay-stack.js';

// 모달은 오버레이 스택(overlay-stack.js)에 올라간다. 메뉴 같은 다른 오버레이와 같은 스택이라,
// 모달 위에 메뉴가 열려 있으면 ESC·Tab·바깥 클릭은 메뉴가 먼저 받는다.

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

// 포커스 순환 범위는 dialog의 DOM 서브트리(Tab 순서는 DOM 순서를 따르므로).
// dialog 안에서 연 메뉴(portal — DOM은 dialog 밖)는 순환에 넣지 않는다. 대신 메뉴가 열리면
// 포커스가 메뉴 안으로 가고, 메뉴가 자기 키(↑↓·ESC·Tab)를 처리한다(menu.js).
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

  // 오버레이 스택에 올릴 항목: 맨 위일 때만 불린다.
  const entry = {
    kind: 'modal',
    modal,
    onPointerDown(e, node) {
      // DOM의 contains가 아니라 논리 트리로 판정 → dialog 안에서 연 portal(DOM은 body)도 "안쪽"
      if (node && isLogicalDescendant(node, dialog)) return;
      modal.close('outside');
    },
    onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        modal.close('escape');
      } else if (e.key === 'Tab') {
        trapTab(e, modal);
      }
      return false;
    },
  };

  pushOverlay(entry);
  lockScroll();

  // 획득한 자원의 해제를 portal 클린업에 예약 → close()든 논리 부모 destroy든 같은 경로로 해제(M5)
  portal.onCleanup(() => {
    closed = true;
    removeOverlay(entry);
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
  return getOverlays()
    .filter((o) => o.kind === 'modal')
    .map((o) => o.modal);
}
