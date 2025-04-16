import { GameDefinition } from './gameDefinition';

export type GetPlayerState<G extends GameDefinition> = G extends GameDefinition<
  any,
  infer T
>
  ? T
  : never;

export type GetGlobalState<G extends GameDefinition> = G extends GameDefinition<
  infer T
>
  ? T
  : never;

export type GetTurnData<G extends GameDefinition> = G extends GameDefinition<
  any,
  any,
  infer T,
  any
>
  ? T
  : never;

export type GetPublicTurnData<G extends GameDefinition> =
  G extends GameDefinition<any, any, any, infer T> ? T : never;
