#!/usr/bin/env node

import { intro, isCancel, outro, select, spinner, text } from '@clack/prompts';
import { camelCase, capitalCase } from 'change-case';
import { exec } from 'child_process';
import { cpTpl } from 'cp-tpl';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as url from 'url';

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
  message: 'What is the name of the package? (use kebab-case)',
  validate: (value) => {
    if (!value) {
      return 'Please enter a name';
    }
  },
});
const camelName = camelCase(name);
const titleName = capitalCase(name);

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

// count number of games in the games dir
const gameCount = (await fs.readdir(path.resolve(__dirname, '../../games')))
  .length;
const devPort = 3300 + gameCount; // start at 3300 and increment for each game

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
    '{{titleName}}': titleName,
    '{{camelName}}': camelName,
    '{{devPort}}': devPort,
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
  // add to packages/games as a dependency and
  // to the game map.
  await addGameToGamesPackage();
  await addGameDevTask();
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

// helpers

async function addGameToGamesPackage() {
  const gamesPackage = path.resolve(__dirname, '../../packages/games');
  const gamesPackageJson = path.resolve(gamesPackage, 'package.json');

  const gamesPackageJsonContent = await fs.readFile(gamesPackageJson, 'utf-8');
  const gamesPackageJsonParsed = JSON.parse(gamesPackageJsonContent);

  gamesPackageJsonParsed.dependencies[`@long-game/game-${name}-definition`] =
    'workspace:*';

  await fs.writeFile(
    gamesPackageJson,
    JSON.stringify(gamesPackageJsonParsed, null, 2),
  );

  // find the `// GENERATED - DO NOT REMOVE THIS LINE` line
  // in games/src/index.ts and add the new game above it.
  const gamesIndex = path.resolve(gamesPackage, 'src/index.ts');
  const gamesIndexContent = await fs.readFile(gamesIndex, 'utf-8');
  const gamesIndexLines = gamesIndexContent.split('\n');

  const generatedLine = gamesIndexLines.findIndex((line) =>
    line.includes('// GENERATED - DO NOT REMOVE THIS LINE'),
  );
  gamesIndexLines.splice(
    generatedLine,
    0,
    `  [${camelName}.id]: ${camelName},`,
  );

  // add the import to the top
  gamesIndexLines.unshift(
    `import ${camelName} from '@long-game/game-${name}-definition';`,
  );

  await fs.writeFile(gamesIndex, gamesIndexLines.join('\n'));
}

async function addGameDevTask() {
  const tasksFilePath = path.resolve(__dirname, '../../.vscode/tasks.json');
  const tasksFileContent = await fs.readFile(tasksFilePath, 'utf-8');
  const tasksFileJson = JSON.parse(tasksFileContent);
  const newTask = {
    type: 'npm',
    script: 'dev-game',
    path: `games/${name}`,
    problemMatcher: ['$tsc-watch'],
    label: `🕹️ ${titleName} Dev`,
    detail: 'pnpm --filter "./*" dev',
  };
  tasksFileJson.tasks.push(newTask);
  await fs.writeFile(tasksFilePath, JSON.stringify(tasksFileJson, null, 2));
  console.log(`Added dev task for ${name} to .vscode/tasks.json`);
}
