import { Avatar, clsx, Tooltip } from '@a-type/ui';
import {
  isHotseatPlayerId,
  isPrefixedId,
  PrefixedId,
  SYSTEM_CHAT_AUTHOR_ID,
  SystemChatAuthorId,
} from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerInfo } from './PlayerInfo.js';
import { usePlayerThemed } from './usePlayerThemed.js';

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
    ? (gameSuite.playerStatuses[onlyPlayerId] ?? null)
    : null;

  let imageUrl: string | null = null;
  if (playerId === SYSTEM_CHAT_AUTHOR_ID) {
    imageUrl = '/icon.png';
  } else if (playerId && isHotseatPlayerId(playerId)) {
    imageUrl = null;
  } else if (playerId) {
    const urlRaw = new URL((window as any).LONG_GAME_CONFIG.API_ORIGIN);
    urlRaw.pathname = `/users/${playerId}/avatar`;
    imageUrl = urlRaw.toString();
  }

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
      disabled={!playerId || gameSuite.gameStatus.status === 'pending'}
    >
      <Avatar
        name={
          playerId === SYSTEM_CHAT_AUTHOR_ID
            ? 'Game'
            : (player?.displayName ?? 'Anonymous')
        }
        imageSrc={imageUrl}
        style={{
          ...style,
          width: size ?? 24,
        }}
        className={clsx(
          'flex-shrink-0 aspect-1 overflow-hidden',
          'border-solid border-2px',
          status?.online ? 'border-primary-dark' : 'border-gray',
          themeClass,
          className,
        )}
        popIn={false}
        crossOrigin="use-credentials"
      />
    </Tooltip>
  );
});
