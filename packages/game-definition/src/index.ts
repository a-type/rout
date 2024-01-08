import { ComponentType } from 'react';
import { GameRandom } from './random.js';

export { GameRandom } from './random.js';

export type BaseMoveData = object;

export interface Move<MoveData extends BaseMoveData> {
  id: string;
  userId: string | null;
  data: MoveData;
  createdAt?: string;
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
  MoveData extends BaseMoveData = any,
  PublicMoveData extends BaseMoveData = MoveData,
> = {
  id: string;
  title: string;

  // SHARED

  /**
   * Processes a set of moves to decide if they will be allowed this turn.
   * Returns an error message if the moves are invalid.
   */
  validateTurn: (data: {
    playerState: PlayerState;
    moves: Move<MoveData>[];
  }) => string | void;
  getProspectivePlayerState: (data: {
    playerState: PlayerState;
    prospectiveMoves: Move<MoveData>[];
    playerId: string;
  }) => PlayerState;

  // SERVER ONLY

  // note that we're picky here about which methods receive `random`.
  // we want certain things to be deterministic, like computing
  // player state from global state, or the status of the game (win conditions).
  // randomness needs to be stable, so we supply random to methods that
  // compute holistic information - initial state and global state from initial.

  getInitialGlobalState: (data: {
    playerIds: string[];
    random: GameRandom;
  }) => GlobalState;
  getPlayerState: (data: {
    globalState: GlobalState;
    playerId: string;
  }) => PlayerState;
  getState: (data: {
    initialState: GlobalState;
    moves: Move<MoveData>[];
    random: GameRandom;
  }) => GlobalState;
  getPublicMove: (data: { move: Move<MoveData> }) => Move<PublicMoveData>;
  /**
   * globalState is the computed current state. moves are provided
   * for reference only, you do not need to recompute the current
   * state.
   */
  getStatus: (data: {
    globalState: GlobalState;
    moves: Move<MoveData>[];
  }) => GameStatus;

  // CLIENT ONLY

  Client: ComponentType<{ session: ClientSession }>;
  GameRecap: ComponentType<{
    globalState: GlobalState;
    session: ClientSession;
  }>;
};

export type ClientSession = {
  id: string;
  gameId: string;
  startedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  timezone: string;
  members: {
    id: string;
    membershipId: string;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    name: string;
    imageUrl: string | null;
  }[];
  localPlayer: { id: string };
  status: GameStatus;
};
