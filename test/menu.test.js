// 모달 안 메뉴 키보드: K1 첫 항목 포커스 · K2 ↑↓ 순환 · K3 ESC는 메뉴만 · K4 선택 후 복귀
// K5 Tab은 메뉴를 닫고 모달 가두기로 이어짐 · K6 바깥 클릭은 메뉴만 · K7 모달이 닫히면 메뉴도 정리
import { describe, test, expect, afterEach, vi } from 'vitest';
import { createRoot, createNode, createModal, createMenu, getOpenModals } from '../src/index.js';

let root;
afterEach(() => {
  root?.destroy();
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

const flush = () => Promise.resolve();
const pointerdown = (el) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
const key = (k, opts = {}) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts });
  (document.activeElement ?? document.body).dispatchEvent(e);
  return e;
};

// 모달 하나 + 그 안에 [앞 버튼] [메뉴 버튼] [뒤 버튼] (menuLast면 메뉴 버튼이 마지막)
async function setup({ menuLast = false, onSelect = () => {} } = {}) {
  const app = document.createElement('div');
  document.body.appendChild(app);
  root = createRoot(app);
  const modal = createModal(root);
  const before = createNode(modal.dialog, 'button', { text: '앞' });
  const anchor = createNode(modal.dialog, 'button', { text: '메뉴' });
  const after = menuLast ? null : createNode(modal.dialog, 'button', { text: '뒤' });
  await flush();
  anchor.el.focus();
  const onClose = vi.fn();
  const menu = createMenu(anchor, {
    items: [
      { label: 'A', onSelect },
      { label: 'B' },
      { label: 'C' },
    ],
    onClose,
  });
  return { modal, before, anchor, after, menu, onClose };
}

describe('K1·K2 포커스 이동', () => {
  test('열면 첫 항목으로 포커스가 간다', async () => {
    const { menu } = await setup();
    expect(document.activeElement).toBe(menu.items[0].el);
  });

  test('↓/↑는 항목 사이를 이동하고 끝에서 반대쪽으로 돈다', async () => {
    const { menu } = await setup();
    const [a, b, c] = menu.items.map((n) => n.el);
    key('ArrowDown');
    expect(document.activeElement).toBe(b);
    key('ArrowDown');
    key('ArrowDown');
    expect(document.activeElement).toBe(a); // C 다음 → A
    key('ArrowUp');
    expect(document.activeElement).toBe(c); // A 이전 → C
  });
});

describe('K3 ESC', () => {
  test('메뉴만 닫히고 포커스는 메뉴 버튼, 모달은 그대로', async () => {
    const { anchor, menu, onClose } = await setup();
    key('Escape');
    expect(document.body.contains(menu.portal.el)).toBe(false);
    expect(onClose).toHaveBeenCalledWith('escape');
    expect(document.activeElement).toBe(anchor.el);
    expect(getOpenModals()).toHaveLength(1);
  });

  test('메뉴가 닫힌 뒤의 ESC는 모달을 닫는다', async () => {
    await setup();
    key('Escape');
    key('Escape');
    expect(getOpenModals()).toHaveLength(0);
  });
});

describe('K4 선택', () => {
  test('항목을 누르면 onSelect → 메뉴 닫힘 → 메뉴 버튼으로 복귀', async () => {
    const onSelect = vi.fn();
    const { anchor, menu, onClose } = await setup({ onSelect });
    menu.items[0].el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('select');
    expect(document.activeElement).toBe(anchor.el);
    expect(getOpenModals()).toHaveLength(1);
  });
});

describe('K5 Tab', () => {
  test('메뉴를 닫고 포커스를 메뉴 버튼에 둔 채 기본 이동은 막지 않는다(버튼이 가장자리가 아닐 때)', async () => {
    const { anchor, onClose } = await setup();
    const e = key('Tab');
    expect(onClose).toHaveBeenCalledWith('tab');
    expect(document.activeElement).toBe(anchor.el);
    expect(e.defaultPrevented).toBe(false); // 브라우저가 버튼 다음 요소로 이동
  });

  test('메뉴 버튼이 모달의 마지막이면 같은 Tab을 모달 가두기가 받아 처음으로 보낸다', async () => {
    const { before } = await setup({ menuLast: true });
    const e = key('Tab');
    expect(e.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(before.el);
    expect(getOpenModals()).toHaveLength(1);
  });
});

describe('K6 바깥 클릭', () => {
  test('모달 안(메뉴 밖)을 누르면 메뉴만 닫힌다', async () => {
    const { before, menu, onClose } = await setup();
    pointerdown(before.el);
    expect(onClose).toHaveBeenCalledWith('outside');
    expect(document.body.contains(menu.portal.el)).toBe(false);
    expect(getOpenModals()).toHaveLength(1);
  });

  test('메뉴 항목·메뉴 버튼의 pointerdown은 메뉴를 닫지 않는다', async () => {
    const { anchor, menu, onClose } = await setup();
    pointerdown(menu.items[1].el);
    pointerdown(anchor.el);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('메뉴가 열려 있을 때 모달 배경을 눌러도 메뉴만 닫힌다(맨 위 하나만 반응)', async () => {
    const { modal, onClose } = await setup();
    pointerdown(modal.overlay.el);
    expect(onClose).toHaveBeenCalledWith('outside');
    expect(getOpenModals()).toHaveLength(1);
  });
});

describe('K7 정리', () => {
  test('모달이 닫히면 메뉴도 연쇄로 정리되고 document 리스너도 해제된다', async () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const { modal, menu, onClose } = await setup();
    modal.close();
    expect(document.body.contains(menu.portal.el)).toBe(false);
    expect(onClose).toHaveBeenCalledWith('destroy');
    expect(remove.mock.calls.map(([t]) => t)).toEqual(expect.arrayContaining(['pointerdown', 'keydown']));
    expect(() => key('Escape')).not.toThrow();
    remove.mockRestore();
  });
});
