import { GameRound } from '@long-game/common';
import { GameRandom } from './random.js';

export type BaseTurnData = Record<string, unknown>;

export interface LocalTurn<TurnData extends BaseTurnData> {
  playerId: `u-${string}`;
  data: TurnData;
}

export interface Turn<TurnData extends BaseTurnData>
  extends LocalTurn<TurnData> {
  createdAt: string;
  roundIndex: number;
}

export type GameStatus =
  | {
      status: 'pending';
    }
  | {
      status: 'active';
    }
  | {
      status: 'completed';
      winnerIds: string[];
    };

export type GameDefinition<
  GlobalState = any,
  PlayerState = any,
  TurnData extends BaseTurnData = any,
  PublicTurnData extends BaseTurnData = TurnData,
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
    members: { id: string }[];
  }) => string | void;
  /**
   * Returns the player state as it would be if the player made the move.
   * This may not be the same as the final computed player state, since
   * we may not want to reveal information about the global state. But,
   * for example, if the player moves a game piece, we may want to show
   * the player the new position of the piece.
   */
  getProspectivePlayerState: (data: {
    playerState: PlayerState;
    prospectiveTurn: LocalTurn<TurnData>;
    playerId: string;
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
    members: { id: string }[];
  }) => GlobalState;
  /**
   * This is the player's view of the game state. It should be deterministically
   * computed from global state.
   */
  getPlayerState: (data: {
    globalState: GlobalState;
    playerId: string;
    roundIndex: number;
    members: { id: string }[];
    rounds: GameRound<Turn<TurnData>>[];
  }) => PlayerState;
  /**
   * This is the computed current state of the game. It should be deterministic.
   * It's computed from the initial state and all moves.
   */
  getState: (data: {
    initialState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    random: GameRandom;
    members: { id: string }[];
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
    viewerId: string;
  }) => Turn<PublicTurnData>;
  /**
   * globalState is the computed current state. moves are provided
   * for reference only, you do not need to recompute the current
   * state.
   */
  getStatus: (data: {
    globalState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    members: { id: string }[];
  }) => GameStatus;
  /**
   * Games can determine how rounds are advanced. There are a few approaches...
   * - Periodic rounds based on some set time interval
   * - Rounds advance when all players submit turns
   */
  getRoundIndex: RoundIndexDecider<GlobalState, TurnData>;
};

export type RoundIndexDecider<
  GlobalState,
  TurnData extends BaseTurnData,
> = (data: {
  turns: Turn<TurnData>[];
  /**
   * Membership information is limited to things that might be
   * useful for determining round index. Try to keep this light.
   */
  members: { id: string }[];
  startedAt: Date;
  currentTime: Date;
  gameTimeZone: string;
}) => number;

export interface GameModule {
  versions: GameDefinition[];
  id: string;
  title: string;
}

export function getLatestVersion(game: GameModule): GameDefinition {
  return game.versions[game.versions.length - 1];
}
