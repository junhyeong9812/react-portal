// 모달 실무 기능: 바깥 클릭(M1), ESC(M2), 포커스(M3), 스크롤 잠금(M4), 정리 일관성(M5)
import { describe, test, expect, afterEach, vi } from 'vitest';
import { createRoot, createNode, createPortal, createModal, getOpenModals } from '../src/index.js';

let root;
afterEach(() => {
  root?.destroy();
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

function mountRoot() {
  const app = document.createElement('div');
  document.body.appendChild(app);
  root = createRoot(app);
  return root;
}

const pointerdown = (el) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
const key = (k, opts = {}) =>
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, ...opts }),
  );
const flush = () => Promise.resolve(); // createModal의 초기 포커스(microtask) 대기

function openWithButtons(parent, opts) {
  const modal = createModal(parent, opts);
  const a = createNode(modal.dialog, 'button', { text: 'A' });
  const b = createNode(modal.dialog, 'button', { text: 'B' });
  return { modal, a, b };
}

describe('M1 바깥 클릭 (논리 트리 기준)', () => {
  test('오버레이를 누르면 닫히고 reason은 outside', () => {
    const onClose = vi.fn();
    const { modal } = openWithButtons(mountRoot(), { onClose });
    pointerdown(modal.overlay.el);
    expect(getOpenModals()).toEqual([]);
    expect(onClose).toHaveBeenCalledWith('outside');
  });

  test('어떤 노드에도 속하지 않는 곳(body)을 눌러도 닫힌다', () => {
    openWithButtons(mountRoot());
    pointerdown(document.body);
    expect(getOpenModals()).toEqual([]);
  });

  test('dialog 안을 누르면 닫히지 않는다', () => {
    const { a } = openWithButtons(mountRoot());
    pointerdown(a.el);
    expect(getOpenModals()).toHaveLength(1);
  });

  test('dialog 안에서 연 portal은 DOM상 dialog 밖이지만 논리 자손이라 "안쪽"이다', () => {
    const { modal, a } = openWithButtons(mountRoot());
    const menu = createPortal(a); // 드롭다운처럼 body로 나가는 비모달 portal
    const item = createNode(menu, 'button', { text: '메뉴 항목' });

    expect(modal.dialog.el.contains(item.el)).toBe(false); // DOM 기준이면 "바깥"
    pointerdown(item.el);
    expect(getOpenModals()).toHaveLength(1); // 논리 기준이라 닫히지 않음
  });

  test('중첩 시 맨 위 모달만 닫힌다', () => {
    const { a } = openWithButtons(mountRoot());
    const { modal: second } = openWithButtons(a);
    pointerdown(second.overlay.el);
    expect(getOpenModals()).toHaveLength(1);
  });
});

describe('M2 ESC', () => {
  test('맨 위 모달 하나씩 닫힌다', async () => {
    const onFirst = vi.fn();
    const { a } = openWithButtons(mountRoot(), { onClose: onFirst });
    openWithButtons(a);
    await flush();

    key('Escape');
    expect(getOpenModals()).toHaveLength(1);
    expect(onFirst).not.toHaveBeenCalled();

    key('Escape');
    expect(getOpenModals()).toHaveLength(0);
    expect(onFirst).toHaveBeenCalledWith('escape');
  });

  test('열린 모달이 없으면 아무 일도 없다', () => {
    mountRoot();
    expect(() => key('Escape')).not.toThrow();
  });
});

describe('M3 포커스', () => {
  test('열면 dialog의 첫 포커스 요소로 이동한다', async () => {
    const { a } = openWithButtons(mountRoot());
    await flush();
    expect(document.activeElement).toBe(a.el);
  });

  test('포커스 요소가 없으면 dialog 자체로 이동한다', async () => {
    const modal = createModal(mountRoot());
    await flush();
    expect(document.activeElement).toBe(modal.dialog.el);
  });

  test('Tab은 마지막 → 처음, Shift+Tab은 처음 → 마지막으로 순환한다', async () => {
    const { a, b } = openWithButtons(mountRoot());
    await flush();

    b.el.focus();
    key('Tab');
    expect(document.activeElement).toBe(a.el);

    key('Tab', { shiftKey: true });
    expect(document.activeElement).toBe(b.el);
  });

  test('포커스가 dialog 밖에 있으면 Tab이 dialog 안으로 되돌린다', async () => {
    const r = mountRoot();
    const outside = createNode(r, 'button', { text: '바깥' });
    const { a } = openWithButtons(r);
    await flush();

    outside.el.focus();
    key('Tab');
    expect(document.activeElement).toBe(a.el);
  });

  test('닫으면 열기 전 포커스 요소로 돌아간다', async () => {
    const r = mountRoot();
    const opener = createNode(r, 'button', { text: '열기' });
    opener.el.focus();
    const { modal } = openWithButtons(r);
    await flush();
    expect(document.activeElement).not.toBe(opener.el);

    modal.close();
    expect(document.activeElement).toBe(opener.el);
  });
});

describe('M4 스크롤 잠금', () => {
  test('열려 있는 동안 잠기고, 마지막 모달이 닫히면 원래 값으로 복원된다', () => {
    document.body.style.overflow = 'scroll';
    const { modal: first, a } = openWithButtons(mountRoot());
    expect(document.body.style.overflow).toBe('hidden');

    const { modal: second } = openWithButtons(a);
    second.close();
    expect(document.body.style.overflow).toBe('hidden'); // 아직 하나 남음

    first.close();
    expect(document.body.style.overflow).toBe('scroll');
  });
});

describe('M5 정리 일관성', () => {
  test('논리 부모를 destroy하면 모달 스택·스크롤 잠금·document 리스너가 전부 해제된다', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const r = mountRoot();
    const card = createNode(r);
    const onClose = vi.fn();
    const { a } = openWithButtons(card, { onClose });
    openWithButtons(a);

    card.destroy();

    expect(getOpenModals()).toEqual([]);
    expect(document.body.style.overflow).toBe('');
    const removedTypes = remove.mock.calls.map(([type]) => type);
    expect(removedTypes).toEqual(expect.arrayContaining(['pointerdown', 'keydown']));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('destroy');
    remove.mockRestore();
  });

  test('close를 두 번 불러도 한 번만 정리된다', () => {
    const onClose = vi.fn();
    const { modal } = openWithButtons(mountRoot(), { onClose });
    modal.close();
    modal.close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
