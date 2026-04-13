import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    mockReset: true,
    coverage: {
      provider: 'v8',
    },
  },
});
