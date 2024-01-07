import { ComponentType } from 'react';

export type BaseMoveData = object;

export interface Move<MoveData extends BaseMoveData> {
  id: string;
  userId: string | null;
  data: MoveData;
  createdAt?: string;
}

export type GameStatus =
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
  getInitialGlobalState: () => GlobalState;
  isValidTurn: (playerState: PlayerState, moves: Move<MoveData>[]) => boolean;
  getProspectivePlayerState: (
    playerState: PlayerState,
    playerId: string,
    prospectiveMoves: Move<MoveData>[],
  ) => PlayerState;
  getPlayerState: (globalState: GlobalState, playerId: string) => PlayerState;
  getState: (initialState: GlobalState, moves: Move<MoveData>[]) => GlobalState;
  getPublicMove: (move: Move<MoveData>) => Move<PublicMoveData>;

  /**
   * globalState is the computed current state. moves are provided
   * for reference only, you do not need to recompute the current
   * state.
   */
  getStatus: (globalState: GlobalState, moves: Move<MoveData>[]) => GameStatus;
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
