import { createRoot, createNode, createPortal, createModal, getOpenModals } from '../src/index.js';
import { bugs, anyBug, createNaiveModal, getNaiveOpen } from './naive-modal.js';

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
//    "문제 재현" 체크박스가 하나라도 켜져 있으면 일부러 틀린 demo/naive-modal.js로 연다
const openModals = () => [...getOpenModals(), ...getNaiveOpen()];
let depth = 0;
function openPortalModal(parent) {
  depth += 1;
  const n = depth;
  const naive = anyBug();
  const make = naive ? createNaiveModal : createModal;
  const modal = make(parent, {
    label: `Portal 모달 #${n}`,
    onClose: (reason) => {
      log(`portal#${n} 닫힘 (reason: ${reason})`, 'native');
      depth = openModals().length;
    },
  });
  modal.portal.handlers.click = () => log(`portal#${n} 핸들러`);
  modal.overlay.el.classList.add('overlay');
  modal.dialog.el.classList.add('modal');

  createNode(modal.dialog, 'h3', { text: `Portal 모달 #${n}` });
  createNode(modal.dialog, 'p', {
    className: 'meta',
    text: `inject(THEME) = "${modal.dialog.inject(THEME)}" · z-index=${modal.portal.el.style.zIndex} · 열린 모달 ${openModals().length}개`,
  });
  createNode(modal.dialog, 'p', {
    className: naive ? 'meta warn' : 'meta',
    text: naive
      ? `⚠ naive 모드: ${Object.keys(bugs).filter((k) => bugs[k]).map((k) => BUG_LABELS[k]).join(' · ')}`
      : 'ESC 또는 어두운 배경 클릭으로 닫힘 · Tab은 이 모달 안에서만 순환 · 배경 스크롤 잠김',
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
        log('메뉴 항목 클릭 — 모달 유지됨 (메뉴는 DOM상 dialog 밖, 논리상 dialog의 자손)', 'native');
        menu.destroy();
      },
    },
  });
}

createNode(actions, 'button', {
  className: 'primary',
  text: 'Portal 모달 열기',
  on: {
    // stopPropagation을 일부러 안 부른다: 여는 click이 document까지 올라가도
    // 라이브러리(pointerdown 캡처)는 멀쩡하고, naive(click 버블)는 열자마자 닫힌다 — N2 재현
    click: () => {
      log('── Portal 모달 열기', 'sep');
      openPortalModal(card);
    },
  },
});

// ── 문제 재현 토글 ──
const BUG_LABELS = {
  domContains: '바깥 판정 DOM contains',
  clickOutside: 'click으로 바깥 감지',
  escAllNoTrap: 'ESC 전체 닫힘 · Tab 탈출',
  noRefcount: '스크롤 잠금 카운트 없음',
};
for (const input of document.querySelectorAll('#bugs input[type=checkbox]')) {
  input.addEventListener('change', () => {
    if (openModals().length > 0) {
      input.checked = !input.checked; // 열린 모달이 있으면 바꾸지 않는다 (잠금 카운트가 섞임)
      log('모달을 모두 닫은 뒤 토글을 바꾸세요', 'native');
      return;
    }
    bugs[input.name] = input.checked;
    log(`${input.checked ? '⚠ 켬' : '끔'}: ${BUG_LABELS[input.name]} → ${anyBug() ? 'naive 모달' : '라이브러리 createModal'}`, 'native');
  });
}

log('준비됨. Portal 모달의 "안쪽 버튼 클릭"을 눌러 보세요: 논리 핸들러는 card·root까지 올라가지만, 네이티브 #app 로그는 찍히지 않습니다.', 'native');
