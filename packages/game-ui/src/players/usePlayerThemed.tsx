import {
  clsx,
  useRender,
  UseRenderComponentProps,
  userModeProps,
} from '@a-type/ui';
import {
  colors,
  PlayerColorName,
  PlayerColorPalette,
  PrefixedId,
} from '@long-game/common';
import { useGameSuite } from '@long-game/game-client';

// stabilized objects
const byPalette: Record<
  PlayerColorName,
  { palette: PlayerColorPalette; className: string; style: React.CSSProperties }
> = Object.fromEntries(
  Object.entries(colors).map(([name, palette]) => [
    name,
    {
      palette,
      className: '@mode-user',
      style: {
        [userModeProps.$userColorHue]: palette.okHue,
        [userModeProps.$userColorSaturation]: palette.okSaturation,
      } as React.CSSProperties,
    },
  ]),
);

export function usePlayerThemed(playerId?: PrefixedId<'u'> | null) {
  const suite = useGameSuite();

  const player = playerId ? suite.getPlayer(playerId) : null;
  if (!player)
    return {
      className: '@mode-user',
      style: {
        [userModeProps.$userColorHue]: 0,
        [userModeProps.$userColorSaturation]: 0,
      } as any,
      palette: colors.gray,
    };

  return byPalette[player.color]!;
}

export function PlayerThemed({
  playerId,
  className,
  style,
  ...rest
}: { playerId?: PrefixedId<'u'> | null } & UseRenderComponentProps<'div'>) {
  const themed = usePlayerThemed(playerId);
  return useRender({
    defaultTagName: 'div',
    props: {
      className: clsx(themed.className, className),
      style: { ...themed.style, ...style },
      ...rest,
    },
  });
}
