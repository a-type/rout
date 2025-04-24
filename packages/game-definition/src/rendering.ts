import { GameRoundSummary } from '@long-game/common';
import { ComponentType } from 'react';
import { GameDefinition } from './gameDefinition';
import { GetPlayerState, GetPublicTurnData, GetTurnData } from './utilTypes';

export type GameRendererVersionDefinition = {
  Client: ComponentType<any>;
  Round: GameRoundRenderer;
};

export type GameRendererModuleDefault = Record<
  string,
  GameRendererVersionDefinition
>;

export type GameRendererModule = {
  default: GameRendererModuleDefault;
};

export type GameRoundRenderer = ComponentType<GameRoundRendererProps<any>>;
export type GameRoundRendererProps<TGame extends GameDefinition> = {
  round: GameRoundSummary<
    GetTurnData<TGame>,
    GetPublicTurnData<TGame>,
    GetPlayerState<TGame>
  >;
  finalPlayerState: GetPlayerState<TGame>;
};
