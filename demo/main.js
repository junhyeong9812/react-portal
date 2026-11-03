import { createRoot, createNode, createPortal, createModal, getOpenModals } from '../src/index.js';

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

// 2) Portal 모달 — createModal: DOM은 body로, 논리 부모는 card
//    ESC·바깥 클릭·포커스 가두기·스크롤 잠금은 라이브러리(src/modal.js)가 처리
let depth = 0;
function openPortalModal(parent) {
  depth += 1;
  const n = depth;
  const modal = createModal(parent, {
    label: `Portal 모달 #${n}`,
    onClose: (reason) => {
      log(`portal#${n} 닫힘 (reason: ${reason})`, 'native');
      depth = getOpenModals().length;
    },
  });
  modal.portal.handlers.click = () => log(`portal#${n} 핸들러`);
  modal.overlay.el.classList.add('overlay');
  modal.dialog.el.classList.add('modal');

  createNode(modal.dialog, 'h3', { text: `Portal 모달 #${n}` });
  createNode(modal.dialog, 'p', {
    className: 'meta',
    text: `inject(THEME) = "${modal.dialog.inject(THEME)}" · z-index=${modal.portal.el.style.zIndex} · 열린 모달 ${getOpenModals().length}개`,
  });
  createNode(modal.dialog, 'p', {
    className: 'meta',
    text: 'ESC 또는 어두운 배경 클릭으로 닫힘 · Tab은 이 모달 안에서만 순환 · 배경 스크롤 잠김',
  });
  const row = createNode(modal.dialog, 'div', { className: 'actions' });

  createNode(row, 'button', {
    text: '안쪽 버튼 클릭',
    on: { click: () => log(`button 핸들러 (portal#${n} 안)`) },
  });
  const menuButton = createNode(row, 'button', {
    text: '메뉴 열기',
    on: { click: (e) => { e.stopPropagation(); toggleMenu(menuButton); } },
  });
  createNode(row, 'button', {
    text: '모달 위에 또 열기',
    on: { click: (e) => { e.stopPropagation(); openPortalModal(modal.dialog); } },
  });
  createNode(row, 'button', {
    className: 'primary',
    text: '닫기',
    on: { click: (e) => { e.stopPropagation(); modal.close(); } },
  });
}

// 3) 모달 안의 드롭다운 메뉴 — 비모달 portal. DOM은 body(= dialog 밖)지만 논리적으로는 dialog의 자손.
//    그래서 메뉴를 눌러도 "바깥 클릭"이 아니다 (DOM contains로 판정했다면 모달이 닫혀 버림).
function toggleMenu(anchor) {
  if (anchor.menu) {
    anchor.menu.destroy();
    anchor.menu = null;
    return;
  }
  const menu = createPortal(anchor);
  anchor.menu = menu;
  menu.onCleanup(() => (anchor.menu = null));

  const rect = anchor.el.getBoundingClientRect();
  const box = createNode(menu, 'div', { className: 'menu' });
  box.el.style.cssText = `position:fixed; top:${rect.bottom + 4}px; left:${rect.left}px`;
  createNode(box, 'button', {
    text: '메뉴 항목',
    on: {
      click: (e) => {
        e.stopPropagation();
        log('메뉴 항목 클릭 — DOM상 dialog 밖이지만 논리 자손이라 모달은 안 닫힘', 'native');
        menu.destroy();
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
