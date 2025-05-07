import { GameSessionChatMessage } from '@long-game/common';
import { ComponentType } from 'react';

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

export type GameChatMessageRenderer =
  ComponentType<GameChatMessageRendererProps>;
export type GameChatMessageRendererProps = {
  message: GameSessionChatMessage;
  previousMessage: GameSessionChatMessage | null;
  nextMessage: GameSessionChatMessage | null;
  compact: boolean;
};
