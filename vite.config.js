import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// 멀티 페이지: 미니 Portal 데모(index.html) + React 비교(react.html)
export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        react: resolve(import.meta.dirname, 'react.html'),
      },
    },
  },
});
