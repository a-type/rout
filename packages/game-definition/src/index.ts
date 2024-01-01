import { ComponentType } from 'react';
import { Session } from '@long-game/common';

export type BaseMoveData = object;

export interface Move<MoveData extends BaseMoveData> {
  id: string;
  userId: string | null;
  data: MoveData;
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
  getInitialGlobalState: () => GlobalState;
  isValidTurn: IsValidTurn<PlayerState, MoveData>;
  getProspectivePlayerState: GetProspectivePlayerState<PlayerState, MoveData>;
  getPlayerState: GetPlayerState<GlobalState, PlayerState>;
  getState: (initialState: GlobalState, moves: Move<MoveData>[]) => GlobalState;
  getPublicMove: (move: Move<MoveData>) => Move<PublicMoveData>;
  Client: ComponentType<{ session: Session }>;
};
