import { GameChatMessageRendererProps } from '@long-game/game-definition';
import { ComponentType, createContext, ReactNode, use } from 'react';
import { DefaultChatMessage } from './chat/DefaultChatMessage.js';

export type LinkComponent = ComponentType<{ to: string; children?: ReactNode }>;

const RendererContext = createContext<{
  ChatRendererComponent: ComponentType<GameChatMessageRendererProps>;
  LinkComponent: LinkComponent;
}>({
  ChatRendererComponent: DefaultChatMessage,
  LinkComponent: ({ to, children }) => <a href={to}>{children}</a>,
});
export const RendererProvider = RendererContext.Provider;
export function useRendererContext() {
  return use(RendererContext);
}
