import { RsbuildConfigSyncFn } from '@rsbuild/core';
const gameRsbuildConfig: (game: {
  id: string;
  versions: { version: string }[];
  devPort: number;
}) => RsbuildConfigSyncFn;
export { gameRsbuildConfig };
