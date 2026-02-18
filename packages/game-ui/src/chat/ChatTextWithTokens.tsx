import { splitChatTokens } from '@long-game/common';
import { GameTitleChatToken } from './tokens/GameTitleChatToken';
import { PlayerHandleChatToken } from './tokens/PlayerHandleChatToken';

export interface ChatTextWithTokensProps {
  children: string;
}

export function ChatTextWithTokens({ children }: ChatTextWithTokensProps) {
  const parts = splitChatTokens(children);

  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part.type === 'game' && part.role === 'title') {
          return <GameTitleChatToken key={index} token={part} />;
        }
        if (part.type === 'player' && part.role === 'handle') {
          return <PlayerHandleChatToken key={index} token={part} />;
        }
        return (
          <span
            data-unknown-token
            data-debug={JSON.stringify(part)}
            key={index}
          >
            ???
          </span>
        );
      })}
    </>
  );
}
