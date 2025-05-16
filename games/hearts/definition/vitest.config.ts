import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
  },
  resolve: {
    conditions: ['development', 'default'],
  },
});
