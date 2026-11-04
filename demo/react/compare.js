// React 진짜 portal(createPortal) vs 가짜 portal(createRoot로 별도 렌더) 비교.
// JSX 없이 createElement(h)로 작성 — 빌드 설정을 늘리지 않기 위해.
import { createElement as h, createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';

export const ThemeContext = createContext('light'); // 기본값 'light'

// 진짜 portal: DOM은 container로, React 트리(Fiber)는 원래 부모 아래 그대로
export function RealPortal({ children, container }) {
  return createPortal(children, container);
}

// 가짜 portal: container에 "새 React 루트"를 만들어 렌더.
// DOM 위치는 진짜와 똑같이 옮겨지지만, React 트리가 새로 시작돼 부모와 끊긴다.
export function FakePortal({ children, container }) {
  const [root, setRoot] = useState(null);

  useEffect(() => {
    const el = document.createElement('div');
    container.appendChild(el);
    const r = createRoot(el);
    setRoot(r);
    return () => {
      // 렌더 도중 다른 루트를 동기 unmount하면 React가 경고한다 → 다음 틱으로 미룸
      setTimeout(() => {
        r.unmount();
        el.remove();
      });
    };
  }, [container]);

  useEffect(() => {
    root?.render(children);
  }, [root, children]);

  return null; // 이 컴포넌트 자리에는 아무것도 그리지 않는다
}

function PortalContent({ id, onLog }) {
  const theme = useContext(ThemeContext);
  return h(
    'div',
    { className: 'portal-box', 'data-testid': `${id}-box` },
    h('p', null, `useContext(ThemeContext) = "${theme}"`),
    h(
      'button',
      { type: 'button', 'data-testid': `${id}-button`, onClick: () => onLog(`${id}: 안쪽 버튼 onClick`) },
      '안쪽 버튼',
    ),
  );
}

// 같은 카드 상황: Provider로 'dark' 제공 + 카드 onClick. 차이는 어떤 Portal로 감싸느냐뿐.
export function Card({ mode, container, onLog }) {
  const Portal = mode === 'real' ? RealPortal : FakePortal;
  return h(
    ThemeContext.Provider,
    { value: 'dark' },
    h(
      'div',
      { className: 'card', 'data-testid': `${mode}-card`, onClick: () => onLog(`${mode}: Card onClick (React 부모)`) },
      h('h3', null, mode === 'real' ? '진짜 portal — createPortal' : '가짜 portal — createRoot'),
      h('p', { className: 'meta' }, 'ThemeContext = "dark" 제공 · onClick 있음'),
      h(Portal, { container }, h(PortalContent, { id: mode, onLog })),
    ),
  );
}
