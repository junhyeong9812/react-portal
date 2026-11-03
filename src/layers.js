// Portal 레이어 스택: 열린 순서대로 z-index를 매긴다(나중에 연 것이 위).
// Portal 컨테이너는 모두 target(body) 최상위에 있으므로, 여기서 매긴 숫자끼리
// 같은 stacking context 안에서 공정하게 비교된다.
export const BASE_Z = 1000;

const stack = [];

function restack() {
  stack.forEach((el, i) => {
    el.style.zIndex = String(BASE_Z + i);
  });
}

export function pushLayer(el) {
  stack.push(el);
  restack();
}

export function removeLayer(el) {
  const i = stack.indexOf(el);
  if (i === -1) return;
  stack.splice(i, 1);
  restack();
}

export function getLayers() {
  return [...stack];
}
