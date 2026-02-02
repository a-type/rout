import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'games/*/definition/vitest.config.ts',
  'packages/*',
  'services/*/vitest.config.ts',
]);
