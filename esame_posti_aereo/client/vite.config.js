import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@popperjs/core/lib/modifiers/arrow': '@popperjs/core/dist/esm/modifiers/arrow.js',
      '@popperjs/core/lib/modifiers/computeStyles': '@popperjs/core/dist/esm/modifiers/computeStyles.js',
      '@popperjs/core/lib/modifiers/eventListeners': '@popperjs/core/dist/esm/modifiers/eventListeners.js',
      '@popperjs/core/lib/modifiers/flip': '@popperjs/core/dist/esm/modifiers/flip.js',
      '@popperjs/core/lib/modifiers/hide': '@popperjs/core/dist/esm/modifiers/hide.js',
      '@popperjs/core/lib/modifiers/offset': '@popperjs/core/dist/esm/modifiers/offset.js',
      '@popperjs/core/lib/modifiers/popperOffsets': '@popperjs/core/dist/esm/modifiers/popperOffsets.js',
      '@popperjs/core/lib/modifiers/preventOverflow': '@popperjs/core/dist/esm/modifiers/preventOverflow.js',
      '@popperjs/core/lib/enums': '@popperjs/core/dist/esm/enums.js',
      '@popperjs/core/lib/popper-base': '@popperjs/core/dist/esm/popper-base.js',
    },
  },
});