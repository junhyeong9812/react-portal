import { register, unregister } from './registry.js';

// 논리 트리의 노드(= React의 컴포넌트 인스턴스에 해당).
// parent는 "논리 부모", domParent는 "실제로 DOM이 붙는 곳".
// 보통은 같지만 Portal에서는 둘이 갈라진다 — 이것이 Portal의 핵심.
export class Node {
  constructor({ el, parent = null, domParent = null, on = {} }) {
    this.el = el;
    this.parent = parent;
    this.children = new Set();
    this.handlers = { ...on };
    this.contexts = new Map();
    this.cleanups = [];
    this.destroyed = false;

    register(el, this);
    if (parent) parent.children.add(this);
    if (domParent) domParent.appendChild(el);
  }

  // Context 제공: 이 노드의 논리 자손 전부가 inject로 읽을 수 있다.
  provide(key, value) {
    this.contexts.set(key, value);
    return this;
  }

  // Context 조회: DOM이 아니라 논리 트리를 따라 올라가며 찾는다.
  inject(key, fallback) {
    for (let n = this; n; n = n.parent) {
      if (n.contexts.has(key)) return n.contexts.get(key);
    }
    return fallback;
  }

  onCleanup(fn) {
    this.cleanups.push(fn);
  }

  // 논리 자손을 먼저 정리(Portal 포함) → 자기 정리 → DOM 제거.
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const child of [...this.children]) child.destroy();
    for (const fn of this.cleanups.splice(0).reverse()) fn();
    unregister(this.el);
    this.parent?.children.delete(this);
    this.el.remove();
  }
}

// 일반 자식 노드: 논리 부모와 DOM 부모가 같다.
export function createNode(parent, tag = 'div', { on, className, text } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return new Node({ el, parent, domParent: parent.el, on });
}
