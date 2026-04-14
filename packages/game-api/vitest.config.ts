import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    mockReset: true,
    dir: 'test',
    coverage: {
      provider: 'v8',
    },
  },
});
