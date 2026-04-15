import { spawn } from 'node:child_process';

const api = spawn(
  'pnpm',
  ['--filter', '@long-game/service-api', 'run', 'dev'],
  {
    stdio: 'inherit',
  },
);
const ui = spawn('pnpm', ['--filter', '@long-game/app', 'run', 'preview'], {
  stdio: 'inherit',
});
const numberGuess = spawn(
  'pnpm',
  ['--filter', '@long-game/game-number-guess-v1', 'run', 'dev'],
  {
    stdio: 'inherit',
  },
);
console.log('Test servers started. Press Ctrl+C to stop.');

api.channel?.on('close', (code) => {
  console.log(`API server exited with code ${code}`);
});
ui.channel?.on('close', (code) => {
  console.log(`UI server exited with code ${code}`);
});
numberGuess.channel?.on('close', (code) => {
  console.log(`Number Guess server exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('Stopping test servers...');
  api.kill();
  ui.kill();
  numberGuess.kill();
  process.exit();
});
