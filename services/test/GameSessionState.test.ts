import { env, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    NAMESPACE: KVNamespace;
  }

  // ...or if you have an existing `Env` type...
  interface ProvidedEnv extends ApiBindings {}
}

describe('GameSessionState', () => {
  describe('Playing number guess', () => {
    it('returns correct historical player states', async () => {
      const id = env.GAME_SESSION_STATE.idFromName('game-session-1');
      const stub = env.GAME_SESSION_STATE.get(id);
      const response = await runInDurableObject(stub, async (instance) => {
        await instance.initialize({
          id: 'gs-1',
          gameId: 'number-guess',
          gameVersion: 'v1.0',
          members: [
            {
              id: 'u-player',
            },
          ],
          randomSeed: 'seed',
          timezone: 'UTC',
        });

        // seed some rounds. the secret number is 56
        // (due to the seed).
        await instance.startGame();
        console.log(await instance.getGlobalState());
        await instance.addTurn('u-player', {
          guess: 1,
        });
        await instance.addTurn('u-player', {
          guess: 100,
        });
        await instance.addTurn('u-player', {
          guess: 56,
        });

        // expect game history to reflect the turns
        expect(await instance.getPlayerState('u-player')).toEqual({
          lastGuessResult: 'correct',
        });
        expect(await instance.getPlayerState('u-player', 0)).toEqual({
          lastGuessResult: 'tooLow',
        });
        expect(await instance.getPlayerState('u-player', 1)).toEqual({
          lastGuessResult: 'tooHigh',
        });
      });
    });
  });
});
