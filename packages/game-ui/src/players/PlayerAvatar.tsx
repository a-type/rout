import { Avatar, clsx } from '@a-type/ui';
import { colors, PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';

export interface PlayerAvatarProps {
  playerId: PrefixedId<'u'>;
  className?: string;
}

export const PlayerAvatar = withGame<PlayerAvatarProps>(function PlayerAvatar({
  gameSuite,
  playerId,
  className,
}) {
  const player = gameSuite.getPlayer(playerId);

  return (
    <Avatar
      name={player.displayName}
      imageSrc={player.imageUrl}
      style={{
        background: colors[player.color].range[3],
        borderWidth: 2,
        borderStyle: 'solid',
      }}
      className={clsx(
        'border border-solid border-2px border-accent',
        className,
      )}
    />
  );
});
