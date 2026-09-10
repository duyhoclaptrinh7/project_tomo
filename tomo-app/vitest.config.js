import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'test/mocks/react-native.js'),
    },
  },
  ssr: {
    noExternal: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.{js,jsx}'],
    setupFiles: ['./test/setupReactNativeMock.js'],
    server: {
      deps: {
        inline: true,
      },
    },
  },
});
