import { BaseTurnData, GameRound } from '@long-game/common';
import { BaseTurnError, GameDefinition, Turn } from './gameDefinition.js';

export type BaseGameDefinitionConfig = {
  GlobalState: any;
  PlayerState: any;
  TurnData: BaseTurnData;
  PublicTurnData: BaseTurnData;
  TurnError: BaseTurnError;
  InitialTurnData: BaseTurnData | null;
};

export interface GameDefinitionConfig {
  GlobalState: any;
  PlayerState: any;
  TurnData: BaseTurnData;
  PublicTurnData?: BaseTurnData;
  TurnError?: BaseTurnError;
  InitialTurnData?: BaseTurnData | null;
}

export type ConfigGlobalState<C extends GameDefinitionConfig> =
  C extends GameDefinitionConfig ? C['GlobalState'] : never;
export type ConfigPlayerState<C extends GameDefinitionConfig> =
  C extends GameDefinitionConfig ? C['PlayerState'] : never;
export type ConfigTurnData<C extends GameDefinitionConfig> =
  C extends GameDefinitionConfig ? C['TurnData'] : never;
export type ConfigPublicTurnData<C extends GameDefinitionConfig> =
  C extends GameDefinitionConfig
    ? Exclude<C['PublicTurnData'], undefined>
    : never;
export type ConfigTurnError<C extends GameDefinitionConfig> =
  C extends GameDefinitionConfig ? Exclude<C['TurnError'], undefined> : never;
export type ConfigInitialTurnData<C extends GameDefinitionConfig> =
  C extends GameDefinitionConfig
    ? Exclude<C['InitialTurnData'], undefined>
    : never;

export type GetPlayerState<G extends GameDefinition> =
  G extends GameDefinition<infer C> ? ConfigPlayerState<C> : never;

export type GetGlobalState<G extends GameDefinition> =
  G extends GameDefinition<infer C> ? ConfigGlobalState<C> : never;

export type GetTurnData<G extends GameDefinition> =
  G extends GameDefinition<infer C> ? ConfigTurnData<C> : never;

export type GetTurnDataOrInitial<G extends GameDefinition> =
  G extends GameDefinition<infer C>
    ? ConfigTurnData<C> | ConfigInitialTurnData<C>
    : never;

export type GetPublicTurnData<G extends GameDefinition> =
  G extends GameDefinition<infer C> ? ConfigPublicTurnData<C> : never;

export type GetRound<G extends GameDefinition> = GameRound<
  Turn<GetTurnData<G>>
>;

export type GetTurnError<G extends GameDefinition> =
  G extends GameDefinition<infer C> ? ConfigTurnError<C> : never;

export type TurnUpdater<G extends GameDefinition> =
  | GetTurnData<G>
  | ((prev: GetTurnDataOrInitial<G>) => GetTurnData<G>);
