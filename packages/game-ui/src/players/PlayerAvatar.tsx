import { Avatar, clsx } from '@a-type/ui';
import {
  isPrefixedId,
  PrefixedId,
  SYSTEM_CHAT_AUTHOR_ID,
  SystemChatAuthorId,
} from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { usePlayerThemed } from './usePlayerThemed';

export interface PlayerAvatarProps {
  playerId?: PrefixedId<'u'> | SystemChatAuthorId;
  className?: string;
  size?: number;
}

export const PlayerAvatar = withGame<PlayerAvatarProps>(function PlayerAvatar({
  gameSuite,
  size,
  playerId,
  className,
}) {
  const onlyPlayerId =
    playerId && isPrefixedId(playerId) ? playerId : undefined;
  const player = onlyPlayerId ? gameSuite.getPlayer(onlyPlayerId) : null;
  const { className: themeClass, style } = usePlayerThemed(onlyPlayerId);

  return (
    <Avatar
      name={
        playerId === SYSTEM_CHAT_AUTHOR_ID
          ? 'Game'
          : player?.displayName ?? 'Anonymous'
      }
      imageSrc={
        playerId === SYSTEM_CHAT_AUTHOR_ID ? '/icon.png' : player?.imageUrl
      }
      style={{
        ...style,
        width: size ?? 24,
        height: size ?? 24,
      }}
      className={clsx(
        'flex-shrink-0 aspect-1',
        'border-solid border-2px border-primary',
        themeClass,
        className,
      )}
      popIn={false}
    />
  );
});
