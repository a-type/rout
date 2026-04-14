import { exec } from 'node:child_process';

exec('pnpm --filter "@long-game/service-api" run dev');
exec('pnpm --filter "@long-game/app" run preview');
console.log('Test servers started. Press Ctrl+C to stop.');
