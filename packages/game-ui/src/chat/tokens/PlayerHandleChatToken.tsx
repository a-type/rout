import { clsx } from '@a-type/ui';
import { isPrefixedId, ParsedChatToken } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { usePlayerThemed } from '../../players/usePlayerThemed';
import cls from './PlayerHandleChatToken.module.css';

export interface PlayerHandleChatTokenProps {
  token: ParsedChatToken;
}

export const PlayerHandleChatToken = withGame<PlayerHandleChatTokenProps>(
  function PlayerHandleChatToken({ gameSuite, token }) {
    if (!isPrefixedId(token.value, 'u')) {
      return '???';
    }
    const player = gameSuite.getPlayer(token.value);
    const playerThemed = usePlayerThemed(player.id);
    return (
      <span
        className={clsx(playerThemed.className, cls.root)}
        style={playerThemed.style}
      >
        {player.displayName}
      </span>
    );
  },
);
