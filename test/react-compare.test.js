// React 비교: 진짜 portal(createPortal) vs 가짜 portal(createRoot)
// R1 Context · R2 이벤트 · R3 DOM 위치
import { describe, test, expect, afterEach, vi } from 'vitest';
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Card } from '../demo/react/compare.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true; // act() 경고 방지 (테스트 환경임을 React에 알림)

let root;
afterEach(async () => {
  await act(async () => root?.unmount());
  await new Promise((r) => setTimeout(r)); // FakePortal의 지연 unmount 대기
  document.body.innerHTML = '';
});

async function renderCard(mode) {
  const app = document.createElement('div');
  const target = document.createElement('div'); // body 아래, 카드 밖
  document.body.append(app, target);
  const onLog = vi.fn();
  root = createRoot(app);
  await act(async () => root.render(h(Card, { mode, container: target, onLog })));
  const $ = (id) => document.querySelector(`[data-testid="${id}"]`);
  return { onLog, card: $(`${mode}-card`), box: $(`${mode}-box`), button: $(`${mode}-button`), target };
}

const click = (el) => act(async () => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('R1 Context', () => {
  test('진짜 portal은 카드가 제공한 "dark"를 읽는다', async () => {
    const { box } = await renderCard('real');
    expect(box.textContent).toContain('"dark"');
  });

  test('가짜 portal은 React 트리가 끊겨 기본값 "light"를 읽는다', async () => {
    const { box } = await renderCard('fake');
    expect(box.textContent).toContain('"light"');
  });
});

describe('R2 이벤트', () => {
  test('진짜 portal 안 클릭은 React 부모(카드)의 onClick까지 올라간다', async () => {
    const { button, onLog } = await renderCard('real');
    await click(button);
    expect(onLog.mock.calls.map(([line]) => line)).toEqual([
      'real: 안쪽 버튼 onClick',
      'real: Card onClick (React 부모)',
    ]);
  });

  test('가짜 portal 안 클릭은 카드 onClick에 닿지 않는다', async () => {
    const { button, onLog } = await renderCard('fake');
    await click(button);
    expect(onLog.mock.calls.map(([line]) => line)).toEqual(['fake: 안쪽 버튼 onClick']);
  });
});

describe('R3 DOM 위치', () => {
  test.each(['real', 'fake'])('%s: 콘텐츠의 DOM은 카드 밖(target)에 있다 — 차이는 DOM이 아니라 React 트리', async (mode) => {
    const { card, box, target } = await renderCard(mode);
    expect(card.contains(box)).toBe(false);
    expect(target.contains(box)).toBe(true);
  });
});
