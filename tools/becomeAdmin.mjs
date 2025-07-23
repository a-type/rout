import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const argv = process.argv.slice(2);

if (argv.length < 1) {
  console.error('Insufficient args. Usage: becomeAdmin.mjs <email> [remote]');
  process.exit(1);
}

let [email, remoteInput] = argv;

if (!email) {
  console.error(
    'Email must be provided. Usage: becomeAdmin.mjs <email> [remote]',
  );
  process.exit(1);
}

const remote = remoteInput === 'true' ? true : false;

const sql = `update User set isProductAdmin = true where email = '${email}';`;
console.log('Running', sql);

spawnSync(
  'pnpm',
  [
    'wrangler',
    'd1',
    'execute',
    'prod-long-game-core',
    '-c',
    './db/wrangler.toml',
    remote ? '--remote' : '--local',
    '--command',
    sql,
  ],
  {
    stdio: 'inherit',
    cwd: join(process.cwd(), 'services'),
  },
);

console.log('Done');
process.exit(0);
