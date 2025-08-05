/**
 * Implements caching logic for computed game state from round data.
 * Game history is immutable, so we can safely cache computed rounds
 * which are completed. However, we can't necessarily safely cache
 * the current round naively. We need to make sure the number
 * of turns is the same.
 *
 * This cache also provides a more convenient API for
 * dealing with the game state and abstracting the actual
 * computation portion, seed random, etc.
 */

import { GameRound, LongGameError } from '@long-game/common';
import { GameDefinition, GameMember } from './gameDefinition.js';
import { GameRandom, GameRandomState } from './random.js';

type StateCheckpoint = {
  state: any;
  randomState: GameRandomState;
  turnCount: number;
  roundIndex: number;
};

export class GameStateCache {
  private cache: StateCheckpoint[] = [];
  private initialState: StateCheckpoint;

  constructor(
    private gameDefinition: GameDefinition,
    private details: {
      randomSeed: string;
      members: GameMember[];
      setupData: any;
    },
  ) {
    const random = new GameRandom(this.details.randomSeed);
    const initialState = this.gameDefinition.getInitialGlobalState({
      random,
      members: this.details.members,
      setupData: this.details.setupData,
    });
    const randomState = random.getState();
    this.initialState = {
      state: initialState,
      randomState,
      turnCount: 0,
      roundIndex: -1,
    };
  }

  /**
   * Get the cached or computed game state for the given rounds.
   * @param rounds The full round history to use, from 0 to the current round you want to compute. In case of a cache hit, not all rounds will be used, but we still need them for consistency.
   */
  getState = (rounds: GameRound<any>[]) => {
    const latestRoundIndex = rounds.length - 1;
    if (latestRoundIndex < 0) {
      return this.initialState.state;
    }

    const latestRound = rounds[latestRoundIndex]!;
    const turnsInLatestRound = latestRound.turns.length;

    // find the latest checkpoint index in our cache which is <= latestRoundIndex. if we do have one for the exact round,
    // we also ensure the turns match. if the turns don't match, we'll keep going back in history
    const cachedIndex = this.cache.findLastIndex((cp, i) => {
      if (!cp) return false;
      if (i > latestRoundIndex) return false;
      // historic rounds are always complete and valid.
      if (i < latestRoundIndex) return true;
      return cp.turnCount === turnsInLatestRound;
    });

    if (cachedIndex < 0) {
      // no cached state found, we need to compute the state from the initial state
      return this.#computeAndCacheState(this.initialState, rounds);
    }

    const cached = this.cache[cachedIndex];
    if (!cached) {
      // something was wrong with the above logic.
      throw new LongGameError(
        LongGameError.Code.InternalServerError,
        `Invalid cache logic: cached index computed at ${cachedIndex} but missing from cache.`,
      );
    }
    if (cachedIndex === latestRoundIndex) {
      // cache hit! we can return the cached state
      return this.cache[cachedIndex]!.state;
    }

    // cache miss, we need to compute the state from the cached checkpoint
    return this.#computeAndCacheState(cached, rounds);
  };

  #computeAndCacheState = (
    checkpoint: StateCheckpoint,
    rounds: GameRound<any>[],
  ) => {
    const random = new GameRandom(
      this.details.randomSeed,
      checkpoint.randomState,
    );
    const members = this.details.members;

    const startFrom = checkpoint.roundIndex + 1;
    const state = rounds.slice(startFrom).reduce((state, round, i) => {
      return this.gameDefinition.applyRoundToGlobalState({
        globalState: state,
        round,
        roundIndex: startFrom + i,
        random,
        members,
      });
    }, structuredClone(checkpoint.state));

    const roundIndex = rounds.length - 1;
    const newCheckpoint: StateCheckpoint = {
      state,
      randomState: random.getState(),
      turnCount: rounds[roundIndex]!.turns.length,
      roundIndex,
    };

    this.cache[roundIndex] = newCheckpoint;
    return newCheckpoint.state;
  };
}
