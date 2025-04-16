import { Avatar, clsx } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { usePlayerThemed } from './usePlayerThemed';

export interface PlayerAvatarProps {
  playerId?: PrefixedId<'u'>;
  className?: string;
  size?: number;
}

export const PlayerAvatar = withGame<PlayerAvatarProps>(function PlayerAvatar({
  gameSuite,
  size,
  playerId,
  className,
}) {
  const player = playerId ? gameSuite.getPlayer(playerId) : null;
  const { className: themeClass, style } = usePlayerThemed(playerId);

  return (
    <Avatar
      name={player?.displayName ?? 'Anonymous'}
      imageSrc={player?.imageUrl}
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
    />
  );
});
