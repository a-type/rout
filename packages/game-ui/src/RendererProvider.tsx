import { GameChatMessageRendererProps } from '@long-game/game-definition';
import { ComponentType, createContext, use } from 'react';
import { DefaultChatMessage } from './chat/DefaultChatMessage';

const RendererContext = createContext<{
  ChatRendererComponent: ComponentType<GameChatMessageRendererProps>;
}>({
  ChatRendererComponent: DefaultChatMessage,
});
export const RendererProvider = RendererContext.Provider;
export function useRendererContext() {
  return use(RendererContext);
}
