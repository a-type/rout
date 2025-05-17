import {
  maxRoundFromTurns,
  notPlayedThisRound,
  roundFormat,
  RoundIndexDecider,
} from '@long-game/game-definition';
import { getCurrentPlayer } from './tricks';

/**
 * Round format changes between "deals" as there's a small drafting phase
 * before the first round of each deal. To make the game more adaptable, the
 * passing rules are generalized to work with 3-5 players -- so no strict
 * "left" or "right" passing, but instead it's based on player ordering and
 * offset.
 *
 * When not drafting, the game is round-robin.
 */

// generalizing this behavior is a pain so...
const handSize3Players = 17;
const handSize4Players = 13;
const handSize5Players = 10;
const handSize = {
  3: handSize3Players,
  4: handSize4Players,
  5: handSize5Players,
};

export function getDraftingRound(
  playerCount: number,
  roundIndex: number,
): {
  /** Whether this round is a new deal of cards */
  isNewDeal: boolean;
  /** Offset from self in player list to pass to */
  passOffset: number | null;
} {
  if (playerCount !== 3 && playerCount !== 4 && playerCount !== 5) {
    throw new Error(
      `Invalid player count: ${playerCount}. Must be 3, 4, or 5.`,
    );
  }
  // each player plays every card in hand, plus N-1 drafting rounds
  const metaPatternCadence =
    handSize[playerCount]! * playerCount * playerCount + (playerCount - 1);
  const metaPatternIndex = Math.floor(roundIndex / metaPatternCadence);
  const metaPatternOffset = roundIndex % metaPatternCadence;
  const subPatternCadence = handSize[playerCount]! * playerCount + 1;
  const subPatternIndex = Math.floor(metaPatternOffset / subPatternCadence);
  const isNewDeal = metaPatternOffset % subPatternCadence === 0;

  if (!isNewDeal) {
    return {
      isNewDeal,
      passOffset: null,
    };
  }

  const passOffset = (1 + subPatternIndex) % playerCount;
  if (passOffset === 0) {
    return {
      isNewDeal,
      passOffset: null,
    };
  }

  return {
    isNewDeal,
    passOffset,
  };
}

// this computes the advancement of player turns per round
// and accounts for the drafting round.
export const getRoundIndex: RoundIndexDecider<any, any> =
  // apply a delay between turns, helps player experience.
  roundFormat.delayedAdvance(2)((ctx) => {
    const currentRoundIndex = maxRoundFromTurns(ctx.turns);
    const draftInfo = getDraftingRound(ctx.members.length, currentRoundIndex);
    // we are drafting, all players must submit a draft selection
    const pendingTurns = notPlayedThisRound({
      turns: ctx.turns,
      roundIndex: currentRoundIndex,
      members: ctx.members,
    });
    if (draftInfo.passOffset && pendingTurns.length > 0) {
      return {
        roundIndex: currentRoundIndex,
        pendingTurns: pendingTurns,
        checkAgainAt: undefined,
      };
    }
    // otherwise, we are in a normal round-robin round, and we must determine the active player
    // by the trick leader and number of played cards in the trick.
    const playerId = getCurrentPlayer(ctx.globalState);
    return {
      roundIndex: currentRoundIndex + 1,
      pendingTurns: [playerId],
      checkAgainAt: undefined,
    };
  });
