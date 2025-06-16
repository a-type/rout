import { GameRound } from '@long-game/common';
import { GameDefinition, Turn } from './gameDefinition';

export type GetPlayerState<G extends GameDefinition> =
  G extends GameDefinition<any, infer T> ? T : never;

export type GetGlobalState<G extends GameDefinition> =
  G extends GameDefinition<infer T> ? T : never;

export type GetTurnData<G extends GameDefinition> =
  G extends GameDefinition<any, any, infer T, any> ? T : never;

export type GetPublicTurnData<G extends GameDefinition> =
  G extends GameDefinition<any, any, any, infer T> ? T : never;

export type GetRound<G extends GameDefinition> = GameRound<
  Turn<GetTurnData<G>>
>;

export type GetTurnError<G extends GameDefinition> =
  G extends GameDefinition<any, any, any, any, infer T> ? T : never;
