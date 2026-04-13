import { RsbuildConfigSyncFn } from '@rsbuild/core';
const gameRsbuildConfig: (game: {
  id: string;
  version: `v${string}`;
  devPort: number;
}) => RsbuildConfigSyncFn;
export { gameRsbuildConfig };
