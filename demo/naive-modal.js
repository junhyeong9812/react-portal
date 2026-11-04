// ⚠️ 학습용: 일부러 틀리게 만든 모달. 라이브러리(src/modal.js)가 "왜 그렇게 만들었는지" 체험하기 위한 것.
// bugs의 각 플래그를 켜면 그 부분만 순진한(naive) 구현으로 바뀐다. 전부 꺼져 있으면 라이브러리와 같은 동작.
import { createNode, createPortal } from '../src/index.js';
import { nodeOf } from '../src/registry.js';

export const bugs = {
  domContains: false, // N1 바깥 판정을 DOM contains로
  clickOutside: false, // N2 바깥 감지를 pointerdown(캡처) 대신 click(버블)으로
  escAllNoTrap: false, // N3 모달 스택 없이 각자 ESC 처리 + Tab 가두기 없음
  noRefcount: false, // N4 스크롤 잠금 참조 카운트 없음
};

const stack = [];
let lockCount = 0;
let savedOverflow = '';

const isLogicalDescendant = (node, ancestor) => {
  for (let n = node; n; n = n.parent) if (n === ancestor) return true;
  return false;
};

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapTab(e, dialogEl) {
  const items = [...dialogEl.querySelectorAll(FOCUSABLE)];
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const inside = dialogEl.contains(active);
  if (e.shiftKey ? !inside || active === first : !inside || active === last) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  }
}

export function createNaiveModal(parent, { onClose, label } = {}) {
  const previousFocus = document.activeElement;
  const portal = createPortal(parent);
  const overlay = createNode(portal, 'div', { className: 'mini-modal-overlay' });
  const dialog = createNode(overlay, 'div', { className: 'mini-modal' });
  dialog.el.setAttribute('role', 'dialog');
  dialog.el.setAttribute('aria-modal', 'true');
  dialog.el.tabIndex = -1;
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
      portal.destroy();
    },
  };
  stack.push(modal);
  const isTop = () => stack[stack.length - 1] === modal;

  // ── 바깥 클릭 ──
  // N2 버그: click을 "버블"로 듣는다(흔한 naive 코드). 여는 click이 아직 document에 도착하기 전에
  //          이 리스너가 붙으므로, 같은 click이 document에 닿는 순간 "바깥"으로 판정 → 열자마자 닫힘.
  const outsideType = bugs.clickOutside ? 'click' : 'pointerdown';
  const outsideCapture = !bugs.clickOutside;
  const onOutside = (e) => {
    if (!isTop()) return;
    // N1 버그: DOM contains → dialog 안에서 연 메뉴(portal, DOM은 body)가 "바깥"이 됨
    const inside = bugs.domContains
      ? dialog.el.contains(e.target)
      : isLogicalDescendant(nodeOf(e.target), dialog);
    if (!inside) modal.close('outside');
  };
  document.addEventListener(outsideType, onOutside, outsideCapture);

  // ── 키보드 ──
  // N3 버그: 모달마다 자기 리스너가 ESC에 반응(맨 위 확인 없음) → ESC 한 번에 전부 닫힘. Tab 가두기도 없음.
  const onKey = (e) => {
    if (e.key === 'Escape') {
      if (bugs.escAllNoTrap || isTop()) modal.close('escape');
    } else if (e.key === 'Tab' && !bugs.escAllNoTrap && isTop()) {
      trapTab(e, dialog.el);
    }
  };
  document.addEventListener('keydown', onKey, true);

  // ── 스크롤 잠금 ──
  // N4 버그: 카운트 없이 열 때 잠그고 닫을 때 무조건 해제 → 위 모달만 닫아도 잠금이 풀림
  if (bugs.noRefcount) {
    document.body.style.overflow = 'hidden';
  } else if (lockCount++ === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  portal.onCleanup(() => {
    closed = true;
    document.removeEventListener(outsideType, onOutside, outsideCapture);
    document.removeEventListener('keydown', onKey, true);
    stack.splice(stack.indexOf(modal), 1);
    if (bugs.noRefcount) document.body.style.overflow = '';
    else if (--lockCount === 0) document.body.style.overflow = savedOverflow;
    if (previousFocus?.isConnected) previousFocus.focus();
    onClose?.(reason);
  });

  queueMicrotask(() => {
    if (closed) return;
    (dialog.el.querySelector(FOCUSABLE) ?? dialog.el).focus();
  });

  return modal;
}

export const anyBug = () => Object.values(bugs).some(Boolean);
export const getNaiveOpen = () => [...stack];
