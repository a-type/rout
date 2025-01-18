import { z } from 'zod';

const localTurnSchema = z.object({
  roundIndex: z.number(),
  turn: z.any(),
});

export class LocalTurnStorage {
  #value: {
    roundIndex: number;
    turn: any;
  } | null = null;
  #gameSessionId: string;

  constructor(gameSessionId: string) {
    this.#gameSessionId = gameSessionId;
  }

  get = (roundIndex: number) => {
    if (this.#value === null) {
      const stored = localStorage.getItem(
        `long-game:game-session:${this.#gameSessionId}:local-turn`,
      );
      if (stored) {
        const parsed = JSON.parse(stored);
        const safe = localTurnSchema.safeParse(parsed);
        if (safe.success) {
          this.#value = { turn: null, ...safe.data };
        } else {
          console.error('Failed to parse local turn storage');
          console.error(safe.error);
          this.clear();
        }
      }
    }
    if (this.#value?.roundIndex !== roundIndex) {
      this.clear();
      return null;
    }
    return this.#value;
  };

  set = (value: any, roundIndex: number) => {
    if (!value) {
      return this.clear();
    }

    this.#value = {
      roundIndex,
      turn: value,
    };
    localStorage.setItem(
      `long-game:game-session:${this.#gameSessionId}:local-turn`,
      JSON.stringify(this.#value),
    );
  };

  clear = () => {
    this.#value = null;
    localStorage.removeItem(
      `long-game:game-session:${this.#gameSessionId}:local-turn`,
    );
  };
}
