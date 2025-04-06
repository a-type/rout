import { intro, isCancel, outro, tasks, text } from '@clack/prompts';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function spawnAsync(cmd, args, { cwd }) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd });
    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exited with code ${code}`));
      }
    });
  });
}

intro('Setting up the repo');

const secrets = {};

for (const key of [
  'GOOGLE_AUTH_CLIENT_ID',
  'GOOGLE_AUTH_CLIENT_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
]) {
  const value = await text({
    message: `Enter the value for ${key}`,
    placeholder: '...',
  });
  if (isCancel(value)) {
    outro('Cancelled');
    process.exit(0);
  }
  secrets[key] = value;
}

const devVars =
  `SESSION_SECRET=notsecretnotsecretnotsecretnotsecret
SOCKET_TOKEN_SECRET=notsecretnotsecretnotsecretnotsecret
EMAIL_FROM=noreply@rout.games
UI_ORIGIN=http://localhost:3100
API_ORIGIN=http://localhost:3101

# real secrets
` +
    Object.entries(secrets)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') || '';
const appEnv = `VITE_PUBLIC_API_ORIGIN=http://localhost:3101
`;
await tasks([
  {
    task: async (msg) => {
      const serviceDirs = readdirSync(join(process.cwd(), 'services/src'));
      for (const path of serviceDirs.filter((dir) => dir !== 'middleware')) {
        await writeFile(
          join(process.cwd(), 'services/src', path, '.dev.vars'),
          devVars,
          { encoding: 'utf8' },
        );
        msg(`Wrote to ${path}`);
      }
      return 'Wrote .dev.vars files';
    },
    title: 'Writing .dev.vars to service directories',
    enabled: devVars.length > 0,
  },
  {
    task: async (msg) => {
      await writeFile(join(process.cwd(), 'app', '.env'), appEnv, {
        encoding: 'utf8',
      });
      msg('Wrote to app .env');
      return 'Wrote .env files';
    },
    title: 'Writing .env to UI projects',
  },
  {
    task: async (msg) => {
      await spawnAsync('pnpm', ['run', 'migrations:apply:local'], {
        cwd: join(process.cwd(), 'services'),
      });
      return 'Migrated database';
    },
    title: 'Migrating the database',
  },
]);

outro('✅ Done. Run pnpm dev to start all services.');
