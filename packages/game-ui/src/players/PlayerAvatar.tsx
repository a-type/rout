import { Avatar, clsx, Tooltip } from '@a-type/ui';
import {
  isPrefixedId,
  PrefixedId,
  SYSTEM_CHAT_AUTHOR_ID,
  SystemChatAuthorId,
} from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerInfo } from './PlayerInfo';
import { usePlayerThemed } from './usePlayerThemed';

export interface PlayerAvatarProps {
  playerId?: PrefixedId<'u'> | SystemChatAuthorId;
  className?: string;
  size?: number | string;
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
  const status = onlyPlayerId
    ? gameSuite.playerStatuses[onlyPlayerId] ?? null
    : null;

  return (
    <Tooltip
      color="white"
      content={
        !playerId ? (
          'Unknown player'
        ) : isPrefixedId(playerId) ? (
          <PlayerInfo playerId={playerId} />
        ) : (
          'The Rout app'
        )
      }
      disabled={!playerId}
    >
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
        }}
        className={clsx(
          'flex-shrink-0 aspect-1',
          'border-solid border-2px',
          status?.online ? 'border-primary-dark' : 'border-gray',
          themeClass,
          className,
        )}
        popIn={false}
      />
    </Tooltip>
  );
});
