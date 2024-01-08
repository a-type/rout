#!/usr/bin/env node

import {
  intro,
  outro,
  spinner,
  text,
  confirm,
  note,
  select,
  isCancel,
} from '@clack/prompts';
import { cpTpl } from 'cp-tpl';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs/promises';
import { exec } from 'child_process';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

intro('Generate something...');

const template = await select({
  message: 'What do you want to make?',
  options: [
    {
      value: 'packages',
      label: 'Package | Internal library',
    },
    {
      value: 'games',
      label: 'Game    | New game definition and renderer',
    },
  ],
});

if (isCancel(template)) {
  outro('Bye!');
  process.exit(0);
}

const name = await text({
  message: 'What is the name of the package?',
  validate: (value) => {
    if (!value) {
      return 'Please enter a name';
    }
  },
});

if (isCancel(name)) {
  outro('Bye!');
  process.exit(0);
}

const location = path.resolve(__dirname, `../../${template}/${name}`);

const exists = await fs
  .access(location)
  .then(() => true)
  .catch(() => false);

if (exists) {
  outro(
    `The directory ${location} already exists. Delete it first if you want to generate this.`,
  );
  process.exit(1);
}

const copySpinner = spinner();

copySpinner.start('Copying files...');

const dontCopy = [
  'node_modules/**/*',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

const copyConfig = {
  replace: {
    '{{name}}': name,
  },
  gitingore: true,
  exclude: dontCopy,
};

await cpTpl(
  path.resolve(__dirname, `./templates/${template}`),
  location,
  copyConfig,
);

if (template === 'games') {
  // TODO: add to packages/games as a dependency and
  // to the game map.
}

copySpinner.stop('Copying complete');

const installSpinner = spinner();

installSpinner.start('Installing dependencies...');

const install = exec('pnpm install', { cwd: location });

await new Promise((resolve) => {
  install.on('close', resolve);
});

installSpinner.stop('Dependencies installed');

outro('Done!');
