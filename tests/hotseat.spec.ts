import { expect, test } from '@playwright/test';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:3101';

const numberGuessGameData = {
  url: 'http://localhost:3333/game-modules/number_guess',
  id: 'number-guess',
  title: 'Number Guess',
  description: 'Guess the number between 1 and 100',
  latestVersion: 'v1',
  minimumPlayers: 1,
  maximumPlayers: 100,
  tags: [],
  versions: [
    {
      version: 'v1',
      minimumPlayers: 1,
      maximumPlayers: 100,
    },
  ],
};

test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Console error: ${msg.text()}`);
    }
  });
  // mock games API
  await page.route(`${API_ORIGIN}/games`, async (route) => {
    await route.fulfill({
      json: {
        'number-guess': numberGuessGameData,
      },
    });
  });
  await page.route(`${API_ORIGIN}/games/number-guess`, async (route) => {
    await route.fulfill({
      json: numberGuessGameData,
    });
  });
  await page.route(`${API_ORIGIN}/users/me`, async (route) => {
    await route.fulfill({
      json: null, // no user logged in
    });
  });
  await page.goto('/games/number-guess');
  await page.clock.install();
});

let window!: any;

test('can play a hotseat game', async ({ page }) => {
  // Expect a title "to contain" a substring.
  await expect(page.getByText('Number Guess')).toBeVisible();

  const hotseatButton = page.getByRole('button', { name: /Try Hotseat/i });
  await hotseatButton.click();

  await expect(page.getByText('Hotseat Setup')).toBeVisible();

  // set the seed using the console gameSuite API
  page.evaluate(async () => {
    await window.gameSuite.setSeed('seed');
    console.debug('Seed set to "seed"');
  });

  // add a player
  // TODO: accessibility...
  const playerCountStepper = page.getByTestId('hotseat-player-count');
  await expect(playerCountStepper).toBeVisible();
  const plusButton = (await playerCountStepper.getByRole('button').all()).at(
    1,
  )!;
  await expect(plusButton).toBeVisible();
  await plusButton.click();

  const startButton = page.getByRole('button', { name: 'Start game' });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // skip game start countdown
  await page.clock.fastForward(2000);

  async function guess(player: 1 | 2, guess: number) {
    await expect(page.getByText('Select Player')).toBeVisible();
    await page.getByRole('button', { name: `Player ${player}` }).click();
    const input = page.getByLabel('Enter your guess:');
    await input.fill(String(guess));
    const submit = page.getByRole('button', { name: 'Submit Turn' });
    await expect(submit).toBeEnabled();
    await submit.click();
    await page.clock.fastForward(6000); // skip turn submit delay
    console.debug(`Player ${player} guessed: ${guess}`);
  }

  await guess(1, 50);
  await guess(2, 1);
  await guess(1, 99);
  await guess(2, 56);

  expect(page.getByText(/You win/i)).toBeVisible();
});
