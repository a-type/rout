import { ComponentType } from 'react';

export type BaseMoveData = object;

export interface Move<MoveData extends BaseMoveData> {
  id: string;
  userId: string | null;
  data: MoveData;
  createdAt?: string;
}

export type IsValidTurn<PlayerState, MoveData extends BaseMoveData> = (
  playerState: PlayerState,
  moves: Move<MoveData>[],
) => boolean;
export type GetPlayerState<GlobalState, PlayerState> = (
  globalState: GlobalState,
  playerId: string,
) => PlayerState;
export type GetProspectivePlayerState<
  PlayerState,
  MoveData extends BaseMoveData,
> = (
  playerState: PlayerState,
  playerId: string,
  prospectiveMoves: Move<MoveData>[],
) => PlayerState;

export type GameDefinition<
  GlobalState = any,
  PlayerState = any,
  MoveData extends BaseMoveData = any,
  PublicMoveData extends BaseMoveData = MoveData,
> = {
  id: string;
  title: string;
  getInitialGlobalState: () => GlobalState;
  isValidTurn: IsValidTurn<PlayerState, MoveData>;
  getProspectivePlayerState: GetProspectivePlayerState<PlayerState, MoveData>;
  getPlayerState: GetPlayerState<GlobalState, PlayerState>;
  getState: (initialState: GlobalState, moves: Move<MoveData>[]) => GlobalState;
  getPublicMove: (move: Move<MoveData>) => Move<PublicMoveData>;
  Client: ComponentType<{ session: ClientSession }>;
};

export type ClientSession = {
  id: string;
  gameId: string;
  status: 'pending' | 'active' | 'completed';
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
};
