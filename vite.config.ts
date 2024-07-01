import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'reflectan',
      fileName: (format) => `reflectan.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'immer', 'lodash'],
      output: {
        globals: {
          react: 'React',
          immer: 'immer',
          lodash: 'lodash'
        }
      }
    }
  }
});
