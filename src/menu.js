import { createNode } from './node.js';
import { createPortal } from './portal.js';
import { pushOverlay, removeOverlay, isLogicalDescendant } from './overlay-stack.js';

// 메뉴(드롭다운): anchor 노드(메뉴 버튼) 아래 논리 자식으로 portal을 열고, 오버레이 스택에 올린다.
// 모달 안에서 열면 모달 위에 쌓이므로, 열려 있는 동안 키보드·바깥 클릭은 메뉴가 먼저 받는다.
// 키 동작은 WAI-ARIA APG Menu Button 패턴의 기본 범위:
//   열면 첫 항목 포커스 · ↑↓ 이동(끝에서 반대쪽) · 항목 선택 → 닫고 버튼 복귀
//   ESC → 메뉴만 닫고 버튼 복귀 · Tab → 메뉴를 닫고 같은 키를 아래 오버레이(모달)에 넘김
//
// items: [{ label, onSelect }] · onClose(reason): 'select' | 'escape' | 'tab' | 'outside' | 'close' | 'destroy'
export function createMenu(anchor, { items = [], onClose } = {}) {
  const portal = createPortal(anchor);
  const box = createNode(portal, 'div', { className: 'mini-menu' });
  const rect = anchor.el.getBoundingClientRect();
  box.el.style.cssText = `position:fixed; top:${rect.bottom + 4}px; left:${rect.left}px`;

  let closed = false;
  let reason = 'destroy';

  const menu = {
    portal,
    items: [],
    close(why = 'close') {
      if (closed) return;
      reason = why;
      portal.destroy();
    },
  };

  menu.items = items.map((item) =>
    createNode(box, 'button', {
      text: item.label,
      on: {
        click: (e) => {
          e.stopPropagation();
          item.onSelect?.();
          menu.close('select');
        },
      },
    }),
  );

  const current = () => menu.items.findIndex((n) => n.el === document.activeElement);
  const focusAt = (i) => {
    const n = menu.items.length;
    if (n) menu.items[((i % n) + n) % n].el.focus();
  };

  const entry = {
    kind: 'menu',
    menu,
    onPointerDown(e, node) {
      // 메뉴 안 · 메뉴 버튼(토글은 버튼의 click이 맡는다)은 바깥이 아니다
      if (node && (isLogicalDescendant(node, portal) || isLogicalDescendant(node, anchor))) return;
      menu.close('outside'); // 메뉴만 닫힌다 — 아래 모달은 이 이벤트를 받지 않는다
    },
    onKey(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusAt(current() + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const i = current();
        focusAt(i < 0 ? -1 : i - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        menu.close('escape');
      } else if (e.key === 'Tab') {
        menu.close('tab'); // 포커스는 버튼으로 → 같은 Tab을 아래(모달)에 넘겨 가두기가 이어서 처리
        return true;
      }
      return false;
    },
  };

  pushOverlay(entry);

  portal.onCleanup(() => {
    closed = true;
    removeOverlay(entry);
    // 바깥 클릭이면 사용자가 누른 곳으로, 부모 destroy면 버튼도 사라지므로 복귀하지 않는다
    if (reason !== 'outside' && reason !== 'destroy' && anchor.el.isConnected) anchor.el.focus();
    onClose?.(reason);
  });

  focusAt(0);
  return menu;
}
