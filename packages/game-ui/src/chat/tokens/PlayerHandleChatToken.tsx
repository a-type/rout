import { clsx } from '@a-type/ui';
import { isPrefixedId, ParsedChatToken } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { usePlayerThemed } from '../../players/usePlayerThemed';

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
        className={clsx(
          playerThemed.className,
          'bg-main-wash bg-darken-1 color-main-ink font-bold text-nowrap px-xs rounded',
        )}
        style={playerThemed.style}
      >
        {player.displayName}
      </span>
    );
  },
);
