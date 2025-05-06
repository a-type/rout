import { GameSessionChatMessage } from '@long-game/common';
import { ComponentType } from 'react';
import { GameDefinition } from './gameDefinition';

export type GameRendererVersionDefinition = {
  Client: ComponentType<any>;
  ChatMessage: GameChatMessageRenderer;
};

export type GameRendererModuleDefault = Record<
  string,
  GameRendererVersionDefinition
>;

export type GameRendererModule = {
  default: GameRendererModuleDefault;
};

export type GameChatMessageRenderer = ComponentType<
  GameChatMessageRendererProps<any>
>;
export type GameChatMessageRendererProps<TGame extends GameDefinition> = {
  message: GameSessionChatMessage;
  previousMessage: GameSessionChatMessage | null;
  nextMessage: GameSessionChatMessage | null;
};
