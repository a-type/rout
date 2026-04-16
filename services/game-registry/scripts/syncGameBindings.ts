/// <reference types="node" />

import { parse } from 'jsonc-morph';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const gamesContent = await fs.readdir(
  path.join(import.meta.dirname, '..', '..', '..', 'games'),
  {
    withFileTypes: true,
  },
);

const gameRoots = gamesContent.filter((entry) => entry.isDirectory());

const gamesAndVersions = (
  await Promise.all(
    gameRoots.map(async (entry) => {
      const childItems = await fs.readdir(
        path.join(entry.parentPath, entry.name),
        {
          withFileTypes: true,
        },
      );
      const versionDirs = childItems
        .filter((item) => item.isDirectory())
        .filter((name) => name.name.startsWith('v'));
      return versionDirs.map((versionDir) => ({
        gameId: entry.name,
        version: versionDir.name,
      }));
    }),
  )
).flat();

const bindingsContent = gamesAndVersions.map(({ gameId, version }) => {
  const bindingName = `game--${gameId}--${version}`;
  return {
    binding: bindingName,
    service: bindingName,
  };
});

const wranglerConfigPath = path.join(
  import.meta.dirname,
  '..',
  'wrangler.jsonc',
);
const wranglerConfigContent = await fs.readFile(wranglerConfigPath, 'utf-8');
const wranglerConfig = parse(wranglerConfigContent);
const root = wranglerConfig.asObjectOrForce();
const services = root.getIfArrayOrForce('services');
services.replaceWith(bindingsContent);

await fs.writeFile(wranglerConfigPath, wranglerConfig.toString());

console.log(
  'Updated game registry wrangler.jsonc with bindings for games:',
  gamesAndVersions,
);
