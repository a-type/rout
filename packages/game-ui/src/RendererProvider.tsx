import { GameChatMessageRendererProps } from '@long-game/game-definition';
import { ComponentType, createContext, ReactNode, use } from 'react';
import { DefaultChatMessage } from './chat/DefaultChatMessage.js';

export type LinkComponent = ComponentType<{ to: string; children?: ReactNode }>;

export interface RenderContextValue {
  ChatRendererComponent: ComponentType<GameChatMessageRendererProps>;
  LinkComponent: LinkComponent;
  navigate: (to: string) => void;
}

const RendererContext = createContext<RenderContextValue>({
  ChatRendererComponent: DefaultChatMessage,
  LinkComponent: ({ to, children }) => <a href={to}>{children}</a>,
  navigate: (to: string) => {
    history.pushState({}, '', to);
  },
});
export const RendererProvider = RendererContext.Provider;
export function useRendererContext() {
  return use(RendererContext);
}

export function useNavigation() {
  const { LinkComponent, navigate } = useRendererContext();
  return { Link: LinkComponent, navigate };
}
