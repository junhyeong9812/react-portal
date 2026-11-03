// 1단계: DOM 이동(I1)과 z-index 레이어(I6)
import { describe, test, expect, afterEach } from 'vitest';
import { createRoot, createNode, createPortal, getLayers, BASE_Z } from '../src/index.js';

let root;
afterEach(() => {
  root?.destroy();
  document.body.innerHTML = '';
});

function setup() {
  const app = document.createElement('div');
  app.id = 'app';
  document.body.appendChild(app);
  root = createRoot(app);
  // 함정 상황: stacking context를 만드는 카드
  const card = createNode(root, 'div', { className: 'card' });
  card.el.style.cssText = 'position:relative; z-index:1; overflow:hidden';
  return { app, card };
}

describe('I1 DOM 이동', () => {
  test('portal 콘텐츠의 DOM 부모는 target(body)이고, 논리 부모의 DOM 안에 있지 않다', () => {
    const { app, card } = setup();
    const portal = createPortal(card);
    const modal = createNode(portal, 'div', { text: 'modal' });

    expect(portal.el.parentNode).toBe(document.body);
    expect(card.el.contains(modal.el)).toBe(false);
    expect(app.contains(modal.el)).toBe(false);
    // 논리 관계는 유지
    expect(portal.parent).toBe(card);
    expect(card.children.has(portal)).toBe(true);
  });

  test('target을 지정하면 그 엘리먼트로 이동한다', () => {
    const { card } = setup();
    const target = document.createElement('section');
    document.body.appendChild(target);
    const portal = createPortal(card, target);
    expect(portal.el.parentNode).toBe(target);
  });

  test('대조군: 일반 자식은 부모 DOM 안에 붙는다', () => {
    const { card } = setup();
    const child = createNode(card);
    expect(child.el.parentNode).toBe(card.el);
  });
});

describe('I6 z-index 레이어', () => {
  test('나중에 연 portal의 z-index가 더 크다', () => {
    const { card } = setup();
    const a = createPortal(card);
    const b = createPortal(card);
    expect(Number(a.el.style.zIndex)).toBe(BASE_Z);
    expect(Number(b.el.style.zIndex)).toBeGreaterThan(Number(a.el.style.zIndex));
    expect(a.el.style.position).toBe('relative');
  });

  test('닫으면 스택에서 빠지고 남은 레이어가 재정렬된다', () => {
    const { card } = setup();
    const a = createPortal(card);
    const b = createPortal(card);
    const c = createPortal(card);
    b.destroy();
    expect(getLayers()).toEqual([a.el, c.el]);
    expect(Number(c.el.style.zIndex)).toBe(BASE_Z + 1);
    expect(document.body.contains(b.el)).toBe(false);
  });

  test('닫은 뒤 새로 연 portal도 기존 것보다 위에 온다', () => {
    const { card } = setup();
    const a = createPortal(card);
    const b = createPortal(card);
    a.destroy();
    const c = createPortal(card);
    expect(Number(c.el.style.zIndex)).toBeGreaterThan(Number(b.el.style.zIndex));
  });
});
