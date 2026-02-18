import { isPrefixedId, ParsedChatToken } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerHandleChatTokenProps {
  token: ParsedChatToken;
}

export const PlayerHandleChatToken = withGame<PlayerHandleChatTokenProps>(
  function PlayerHandleChatToken({ gameSuite, token }) {
    if (!isPrefixedId(token.value, 'u')) {
      return '???';
    }
    const player = gameSuite.getPlayer(token.value);
    return <span>{player.displayName}</span>;
  },
);
