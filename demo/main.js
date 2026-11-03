import { createRoot, createNode, createPortal, getLayers } from '../src/index.js';

const THEME = Symbol('theme');
const logEl = document.getElementById('log');
const app = document.getElementById('app');

function log(text, cls = '') {
  const li = document.createElement('li');
  li.textContent = text;
  if (cls) li.className = cls;
  logEl.appendChild(li);
  logEl.scrollTop = logEl.scrollHeight;
}
document.getElementById('clear-log').addEventListener('click', () => (logEl.innerHTML = ''));

// 대조군: 네이티브 DOM 버블링이 #app까지 오는지 관찰
app.addEventListener('click', () => log('[네이티브] #app이 DOM 버블링으로 클릭을 받음', 'native'));

// ── 논리 트리 구성 ──
const root = createRoot(app).provide(THEME, 'light');
root.handlers.click = () => log('root 핸들러 (논리 루트)');

const card = createNode(root, 'div', { className: 'card' }).provide(THEME, 'dark');
card.handlers.click = (e) => {
  if (e.target === card) return;
  log('card 핸들러 (논리 부모)');
};
createNode(card, 'p', { text: '카드 (stacking context · overflow: hidden · theme=dark 제공)' });
const actions = createNode(card, 'div', { className: 'actions' });

// ── 모달 생성 ──
function buildModal(parent, { title, trapped }) {
  const overlay = createNode(parent, 'div', { className: 'overlay' });
  const modal = createNode(overlay, 'div', { className: trapped ? 'modal trapped' : 'modal' });
  createNode(modal, 'h3', { text: title });
  const meta = createNode(modal, 'p', { className: 'meta' });
  meta.el.textContent = `inject(THEME) = "${modal.inject(THEME)}"`;
  const row = createNode(modal, 'div', { className: 'actions' });
  return { overlay, modal, meta, row };
}

// 1) 함정: 일반 자식으로 연 모달 — 카드의 stacking context·overflow에 갇힘
let trapped = null;
createNode(actions, 'button', {
  text: '일반 자식 모달 열기',
  on: {
    click: () => {
      log('── 일반 자식 모달 열기', 'sep');
      if (trapped) return;
      trapped = buildModal(card, { title: '일반 자식 모달', trapped: true });
      trapped.meta.el.textContent +=
        ' · 카드 안에 갇혀 잘리고, z-index 9999를 줘도 헤더 아래에 깔립니다.';
      trapped.overlay.el.style.zIndex = '9999';
      createNode(trapped.row, 'button', {
        text: '닫기',
        on: { click: (e) => { e.stopPropagation(); trapped.overlay.destroy(); trapped = null; } },
      });
    },
  },
});

// 2) Portal 모달 — DOM은 body로, 논리 부모는 card
let depth = 0;
function openPortalModal(parent) {
  depth += 1;
  const portal = createPortal(parent, document.body, {
    on: { click: () => log(`portal#${portal.depth} 핸들러`) },
  });
  portal.depth = depth;
  const m = buildModal(portal, { title: `Portal 모달 #${depth}` });
  m.meta.el.textContent += ` · z-index=${portal.el.style.zIndex} · 열린 레이어 ${getLayers().length}개`;

  createNode(m.row, 'button', {
    text: '안쪽 버튼 클릭',
    on: { click: () => log(`button 핸들러 (portal#${portal.depth} 안)`) },
  });
  createNode(m.row, 'button', {
    text: '모달 위에 또 열기',
    on: { click: (e) => { e.stopPropagation(); openPortalModal(portal); } },
  });
  createNode(m.row, 'button', {
    className: 'primary',
    text: '닫기',
    on: {
      click: (e) => {
        e.stopPropagation();
        log(`portal#${portal.depth} destroy → 그 위에 연 portal도 함께 정리`, 'native');
        portal.destroy();
        depth = getLayers().length;
      },
    },
  });
}

createNode(actions, 'button', {
  className: 'primary',
  text: 'Portal 모달 열기',
  on: {
    click: (e) => {
      e.stopPropagation();
      log('── Portal 모달 열기', 'sep');
      openPortalModal(card);
    },
  },
});

log('준비됨. Portal 모달의 "안쪽 버튼 클릭"을 눌러 보세요: 논리 핸들러는 card·root까지 올라가지만, 네이티브 #app 로그는 찍히지 않습니다.', 'native');
