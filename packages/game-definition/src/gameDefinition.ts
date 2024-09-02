import { ComponentType } from 'react';
import { GameRandom } from './random.js';
import { GameRound, PlayerColorName } from '@long-game/common';
import { FragmentOf } from '@long-game/graphql';
import { clientSessionFragment } from './fragments.js';

export type BaseTurnData = object;

export interface LocalTurn<TurnData extends BaseTurnData> {
  userId: string;
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

  getInitialGlobalState: (data: {
    random: GameRandom;
    members: { id: string }[];
  }) => GlobalState;
  getPlayerState: (data: {
    globalState: GlobalState;
    playerId: string;
    roundIndex: number;
    members: { id: string }[];
  }) => PlayerState;
  getState: (data: {
    initialState: GlobalState;
    rounds: GameRound<Turn<TurnData>>[];
    random: GameRandom;
    members: { id: string }[];
  }) => GlobalState;
  getPublicTurn: (data: {
    turn: Turn<TurnData>;
    globalState: GlobalState;
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

  // CLIENT ONLY

  Client: ComponentType<{ session: FragmentOf<typeof clientSessionFragment> }>;
  GameRecap: ComponentType<{
    globalState: GlobalState;
    session: FragmentOf<typeof clientSessionFragment>;
  }>;
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
