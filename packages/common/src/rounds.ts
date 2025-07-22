import { z } from 'zod';
import { idShapes } from './ids.js';

/**
 * Gets the start and end of the round for a given day.
 * Start is inclusive, end is exclusive.
 */
export function getRoundTimerange(day: Date, timezone: string) {
  const today = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    day.getHours(),
    day.getMinutes(),
  );
  const tomorrow = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    day.getHours(),
    day.getMinutes() + 1,
  );

  const roundStart = new Date(
    today.toLocaleString('en-US', {
      timeZone: timezone,
    }),
  );
  const roundEnd = new Date(
    tomorrow.toLocaleString('en-US', {
      timeZone: timezone,
    }),
  );

  return {
    roundStart,
    roundEnd,
  };
}

export type GameRound<Turn> = {
  turns: Turn[];
  roundIndex: number;
};
export const gameRoundShape = z.object({
  turns: z.array(z.any()),
  roundIndex: z.number(),
});

export type GameRoundSummary<TurnData, PublicTurnData, PlayerState> = {
  /**
   * Played turns for this round. If the turn data is not yet public (current round)
   * it will be null, but the presence of a turn indicates the player did submit
   * a turn for that round. Once a round has passed, turn data becomes public.
   */
  turns: { playerId: string; data: PublicTurnData | null }[];
  /**
   * The turn data for the current player. If the current player did
   * not play this round, this will be null. This is the full TurnData,
   * not the public version; players always have historical access to
   * exactly what they did each round.
   */
  yourTurnData: TurnData | null;
  /**
   * At the start of the round, this was the public game state (according to this
   * player's perspective). If this is a historical round and you want to see
   * the final game state, fetch the next round.
   */
  initialPlayerState: PlayerState;
  /**
   * The index of this round. 0-based.
   */
  roundIndex: number;
};
export const gameRoundSummaryShape = z.custom<GameRoundSummary<any, any, any>>(
  (v) =>
    z
      .object({
        turns: z.array(
          z.object({
            playerId: idShapes.User,
            data: z.unknown().nullable(),
          }),
        ),
        yourTurnData: z.unknown().nullable(),
        initialPlayerState: z.unknown(),
        roundIndex: z.number(),
      })
      .parse(v),
);
