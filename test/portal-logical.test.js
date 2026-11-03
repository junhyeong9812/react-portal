// 2단계: 논리 트리 — 이벤트 버블링(I2·I3), 생명주기(I4), Context(I5)
import { describe, test, expect, afterEach, vi } from 'vitest';
import { createRoot, createNode, createPortal, getLayers } from '../src/index.js';

let root;
afterEach(() => {
  root?.destroy();
  document.body.innerHTML = '';
});

function mountRoot() {
  const app = document.createElement('div');
  document.body.appendChild(app);
  root = createRoot(app);
  return root;
}

const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

describe('I2 논리 버블링', () => {
  test('portal 내부 클릭이 DOM이 아닌 논리 부모 체인을 따라 올라간다', () => {
    const order = [];
    const r = mountRoot();
    r.handlers.click = () => order.push('root');
    const card = createNode(r, 'div', { on: { click: () => order.push('card') } });
    const portal = createPortal(card, document.body, { on: { click: () => order.push('portal') } });
    const button = createNode(portal, 'button', { on: { click: () => order.push('button') } });

    click(button.el);

    expect(order).toEqual(['button', 'portal', 'card', 'root']);
  });

  test('DOM 조상이지만 논리 조상이 아닌 컴포넌트의 핸들러는 호출되지 않는다', () => {
    const r = mountRoot();
    const sibling = createNode(r, 'div', { on: { click: vi.fn() } });
    const card = createNode(r, 'div', { on: { click: vi.fn() } });
    // portal을 형제(sibling)의 DOM 안으로 보낸다 → DOM상 조상은 sibling
    const portal = createPortal(card, sibling.el);
    const button = createNode(portal, 'button');

    expect(sibling.el.contains(button.el)).toBe(true);
    click(button.el);

    expect(card.handlers.click).toHaveBeenCalledTimes(1);
    expect(sibling.handlers.click).not.toHaveBeenCalled();
  });

  test('portal target이 루트 DOM 안이어도 핸들러는 한 번만 호출된다', () => {
    const r = mountRoot();
    const onClick = vi.fn();
    const card = createNode(r, 'div', { on: { click: onClick } });
    const portal = createPortal(card, r.el);
    click(createNode(portal, 'button').el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('event.target은 시작 노드, currentTarget은 현재 핸들러 노드', () => {
    const r = mountRoot();
    let seen;
    const card = createNode(r, 'div', {
      on: { click: (e) => (seen = { target: e.target, current: e.currentTarget }) },
    });
    const button = createNode(createPortal(card), 'button');
    click(button.el);
    expect(seen.target).toBe(button);
    expect(seen.current).toBe(card);
  });
});

test('위임 대상이 아닌 이벤트 타입을 등록하면 경고한다(무음 실패 방지)', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  createNode(mountRoot(), 'div', { on: { mouseover: () => {} } });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('mouseover'));
  warn.mockRestore();
});

describe('I3 stopPropagation', () => {
  test('호출한 지점 위의 논리 조상 핸들러는 호출되지 않는다', () => {
    const r = mountRoot();
    const onRoot = vi.fn();
    r.handlers.click = onRoot;
    const card = createNode(r, 'div', { on: { click: vi.fn() } });
    const portal = createPortal(card, document.body, { on: { click: (e) => e.stopPropagation() } });
    const onButton = vi.fn();
    click(createNode(portal, 'button', { on: { click: onButton } }).el);

    expect(onButton).toHaveBeenCalledTimes(1);
    expect(card.handlers.click).not.toHaveBeenCalled();
    expect(onRoot).not.toHaveBeenCalled();
  });
});

describe('I4 생명주기', () => {
  test('논리 부모를 destroy하면 portal DOM·레이어가 제거되고 핸들러가 끊긴다', () => {
    const r = mountRoot();
    const card = createNode(r);
    const portal = createPortal(card);
    const onButton = vi.fn();
    const button = createNode(portal, 'button', { on: { click: onButton } });

    card.destroy();

    expect(document.body.contains(portal.el)).toBe(false);
    expect(getLayers()).not.toContain(portal.el);
    expect(portal.destroyed && button.destroyed).toBe(true);
    expect(r.children.has(card)).toBe(false);

    // 떼어낸 DOM을 억지로 다시 붙여도 리스너·등록이 해제되어 핸들러가 불리지 않는다
    document.body.appendChild(portal.el);
    click(button.el);
    expect(onButton).not.toHaveBeenCalled();
  });

  test('portal만 destroy하면 논리 부모는 살아 있다', () => {
    const r = mountRoot();
    const card = createNode(r);
    const portal = createPortal(card);
    portal.destroy();
    expect(card.destroyed).toBe(false);
    expect(card.children.has(portal)).toBe(false);
    expect(r.el.contains(card.el)).toBe(true);
  });
});

describe('I5 Context', () => {
  const THEME = Symbol('theme');

  test('portal 내부에서 portal 경계를 넘어 가장 가까운 논리 조상의 값을 읽는다', () => {
    const r = mountRoot().provide(THEME, 'light');
    const card = createNode(r).provide(THEME, 'dark');
    const button = createNode(createPortal(card), 'button');
    expect(button.inject(THEME)).toBe('dark');
  });

  test('DOM 조상이 provide해도 논리 조상이 아니면 무시된다', () => {
    const r = mountRoot();
    const sibling = createNode(r).provide(THEME, 'sibling');
    const card = createNode(r);
    const button = createNode(createPortal(card, sibling.el), 'button');
    expect(button.inject(THEME, 'default')).toBe('default');
  });
});
