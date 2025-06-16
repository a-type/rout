import {
  GameRound,
  GameSessionChatInit,
  GameStatus,
  PrefixedId,
} from '@long-game/common';
import { GameRandom, GameRandomState } from './random.js';
import { RoundIndexDecider } from './rounds.js';

export type BaseTurnData = Record<string, unknown>;

export interface LocalTurn<TurnData extends BaseTurnData> {
  playerId: PrefixedId<'u'>;
  data: TurnData;
}

export interface Turn<TurnData extends BaseTurnData>
  extends LocalTurn<TurnData> {
  createdAt: string;
  roundIndex: number;
}

export type SystemChatMessage = Omit<GameSessionChatInit, 'roundIndex'>;

export type GameMember = {
  id: PrefixedId<'u'>;
};

export type BaseTurnError = {
  code: string;
  message: string;
  data?: Record<string, unknown>;
};

export type GameDefinition<
  GlobalState = any,
  PlayerState = any,
  TurnData extends BaseTurnData = any,
  PublicTurnData extends BaseTurnData = TurnData,
  TurnError extends BaseTurnError = BaseTurnError,
> = {
  version: `v${number}.${number}`;
  minimumPlayers: number;
  maximumPlayers: number;
  // SHARED

  /**
   * Processes a set of moves to decide if they will be allowed this turn.
   * Returns an error message if the moves are invalid.
   */
  validateTurn: (data: {
    playerState: PlayerState;
    turn: LocalTurn<TurnData>;
    roundIndex: number;
    members: GameMember[];
  }) => TurnError | string | void;
  /**
   * Returns the player state as it would be if the player made the move.
   * This may not be the same as the final computed player state, since
   * we may not want to reveal information about the global state. But,
   * for example, if the player moves a game piece, we may want to show
   * the player the new position of the piece.
   */
  getProspectivePlayerState: (data: {
    playerId: PrefixedId<'u'>;
    playerState: PlayerState;
    prospectiveTurn: LocalTurn<TurnData>;
  }) => PlayerState;

  // SERVER ONLY

  // note that we're picky here about which methods receive `random`.
  // we want certain things to be deterministic, like computing
  // player state from global state, or the status of the game (win conditions).
  // randomness needs to be stable, so we supply random to methods that
  // compute holistic information - initial state and global state from initial.

  /**
   * This is the initial state of the game. It should be deterministic.
   */
  getInitialGlobalState: (data: {
    random: GameRandom;
    members: GameMember[];
  }) => GlobalState;
  /**
   * This is the player's view of the game state. It should be deterministically
   * computed from global state.
   */
  getPlayerState: (data: {
    globalState: GlobalState;
    playerId: PrefixedId<'u'>;
    members: GameMember[];
    /**
     * All rounds which have been played. These are all reflected
     * in globalState, but are available for reference. If a current
     * round is in progress, it is not included here -- you should not
     * use the the current round to compute player state as it may leak
     * information about other players' moves. If you really need this
     * maybe we can include it as a separate parameter just to be safe?
     */
    rounds: GameRound<Turn<TurnData>>[];
    playerTurn: Turn<TurnData> | null;
    /** easier than counting rounds */
    roundIndex: number;
  }) => PlayerState;

  applyRoundToGlobalState: (data: {
    globalState: GlobalState;
    round: GameRound<Turn<TurnData>>;
    random: GameRandom;
    members: GameMember[];
    roundIndex: number;
  }) => GlobalState;

  /**
   * This is the public view of a turn, visible to all players
   * after the turn has been played. The public info can also
   * be customized based on the viewer's id, for example to show
   * a player their own move in a different way from others'.
   */
  getPublicTurn: (data: {
    turn: Turn<TurnData>;
    globalState: GlobalState;
    viewerId: PrefixedId<'u'>;
  }) => Turn<PublicTurnData>;
  /**
   * globalState is the computed current state. moves are provided
   * for reference only, you do not need to recompute the current
   * state.
   */
  getStatus: (data: {
    globalState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    members: GameMember[];
  }) => GameStatus;
  /**
   * Games can determine how rounds are advanced. There are a few approaches...
   * - Periodic rounds based on some set time interval
   * - Rounds advance when all players submit turns
   */
  getRoundIndex: RoundIndexDecider<GlobalState, TurnData>;

  /**
   * Optionally customize the message sent to players when the round changes.
   * You may want to use this to summarize what happened. You can also attach
   * custom metadata to use in a customized chat message render component as
   * part of your game UI.
   */
  getRoundChangeMessages?: (data: {
    globalState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    members: GameMember[];
    roundIndex: number;
    newRound: GameRound<Turn<TurnData>>;
    completedRound: GameRound<Turn<TurnData>> | null;
  }) => SystemChatMessage[];
};

export function validateGameDefinition(game: GameDefinition) {
  // no-op, for now
}

/**
 * Computes game state from the initial state and rounds.
 */
export function getGameState(
  game: GameDefinition,
  rounds: GameRound<any>[],
  ctx: {
    random: GameRandom;
    members: GameMember[];
  },
) {
  const initialState = game.getInitialGlobalState(ctx);

  return rounds.reduce((state, round, i) => {
    return game.applyRoundToGlobalState({
      ...ctx,
      globalState: state,
      round,
      roundIndex: i,
    });
  }, initialState);
}

export function getGameStateFromCheckpoint(
  game: GameDefinition,
  checkpoint: {
    // we must restore the seed random state to ensure determinism
    randomState: GameRandomState;
    state: any;
    roundIndex: number;
  },
  rounds: GameRound<any>[],
  ctx: {
    random: GameRandom;
    members: GameMember[];
  },
) {
  return rounds.reduce((state, round, i) => {
    return game.applyRoundToGlobalState({
      ...ctx,
      globalState: state,
      round,
      roundIndex: checkpoint.roundIndex + i,
    });
  }, checkpoint.state);
}
