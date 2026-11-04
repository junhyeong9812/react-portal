import { createElement as h, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Card } from './compare.js';

function App() {
  const [logs, setLogs] = useState([]);
  const onLog = useCallback((line) => setLogs((prev) => [...prev, line]), []);

  return h(
    'main',
    { className: 'layout' },
    h(
      'section',
      null,
      h('h1', null, 'React createPortal 비교'),
      h(
        'p',
        { className: 'lead' },
        '두 카드는 똑같이 ThemeContext="dark"와 onClick을 가집니다. 차이는 콘텐츠를 createPortal로 내보내느냐, createRoot로 별도 렌더하느냐뿐입니다. 콘텐츠는 둘 다 아래 "body 영역"(카드 밖)에 그려집니다.',
      ),
      h(
        'div',
        { className: 'cards' },
        h(Card, { mode: 'real', container: document.getElementById('real-target'), onLog }),
        h(Card, { mode: 'fake', container: document.getElementById('fake-target'), onLog }),
      ),
    ),
    h(
      'aside',
      { className: 'log' },
      h(
        'div',
        { className: 'log-head' },
        h('h2', null, '이벤트 로그'),
        h('button', { type: 'button', onClick: () => setLogs([]) }, '지우기'),
      ),
      h('ol', null, logs.map((line, i) => h('li', { key: i }, line))),
    ),
  );
}

createRoot(document.getElementById('root')).render(h(App));
