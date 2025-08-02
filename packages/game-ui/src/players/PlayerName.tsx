import {
  PrefixedId,
  SYSTEM_CHAT_AUTHOR_ID,
  SystemChatAuthorId,
} from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerNameProps {
  playerId: PrefixedId<'u'> | SystemChatAuthorId;
  disableYou?: boolean;
}

export const PlayerName = withGame<PlayerNameProps>(function PlayerName({
  gameSuite,
  playerId,
  disableYou = false,
}) {
  const player =
    playerId && playerId !== SYSTEM_CHAT_AUTHOR_ID
      ? gameSuite.getPlayer(playerId)
      : null;
  const isMe = playerId === gameSuite.playerId;

  if (isMe && !disableYou) {
    return <>You</>;
  }

  if (playerId === SYSTEM_CHAT_AUTHOR_ID) {
    return <>Game</>;
  }

  return <>{player?.displayName ?? 'Anonymous'}</>;
});
