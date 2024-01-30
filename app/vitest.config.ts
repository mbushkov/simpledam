import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
        "@": path.resolve(__dirname, "./src/"),
        vue: 'vue/dist/vue.esm-bundler.js',
    }
  },    
  test: {
    include: ['**/*.spec.ts'],
    globals: true,
    browser: {
      enabled: true,
      name: 'chrome', // browser name is required
    },
  },
})