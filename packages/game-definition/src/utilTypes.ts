import { GameRound } from '@long-game/common';
import { GameDefinition, Turn } from './gameDefinition';

export type GetPlayerState<G extends GameDefinition> =
  G extends GameDefinition<any, infer T, any, any, any, any> ? T : never;

export type GetGlobalState<G extends GameDefinition> =
  G extends GameDefinition<infer T, any, any, any, any, any> ? T : never;

export type GetTurnData<G extends GameDefinition> =
  G extends GameDefinition<any, any, infer T, any, any, any> ? T : never;

export type GetTurnDataOrInitial<G extends GameDefinition> =
  G extends GameDefinition<any, any, infer T, any, any, infer I>
    ? T | I
    : G extends GameDefinition<any, any, infer T>
      ? T | null
      : never;

export type GetPublicTurnData<G extends GameDefinition> =
  G extends GameDefinition<any, any, any, infer T, any, any> ? T : never;

export type GetRound<G extends GameDefinition> = GameRound<
  Turn<GetTurnData<G>>
>;

export type GetTurnError<G extends GameDefinition> =
  G extends GameDefinition<any, any, any, any, infer E, any> ? E : never;

export type TurnUpdater<G extends GameDefinition> =
  | GetTurnData<G>
  | ((prev: GetTurnDataOrInitial<G>) => GetTurnData<G>);
