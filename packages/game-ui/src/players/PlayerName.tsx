import {
  PrefixedId,
  SYSTEM_CHAT_AUTHOR_ID,
  SystemChatAuthorId,
} from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerNameProps {
  playerId: PrefixedId<'u'> | SystemChatAuthorId;
}

export const PlayerName = withGame<PlayerNameProps>(function PlayerName({
  gameSuite,
  playerId,
}) {
  const player =
    playerId && playerId !== SYSTEM_CHAT_AUTHOR_ID
      ? gameSuite.getPlayer(playerId)
      : null;
  return (
    <>
      {playerId === SYSTEM_CHAT_AUTHOR_ID
        ? 'Game'
        : player?.displayName ?? 'Anonymous'}
    </>
  );
});
