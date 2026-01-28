import { PROPS } from '@a-type/ui';
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
      className: 'palette-primary',
      style: {
        [PROPS.USER.COLOR.PRIMARY_HUE]: palette.okHue,
        [PROPS.USER.COLOR.ACCENT_HUE]: 160,
        [PROPS.USER.SATURATION]: palette.okSaturation,
      } as React.CSSProperties,
    },
  ]),
);

export function usePlayerThemed(playerId?: PrefixedId<'u'> | null) {
  const suite = useGameSuite();

  const player = playerId ? suite.getPlayer(playerId) : null;
  if (!player)
    return {
      className: 'palette-primary',
      style: {
        [PROPS.USER.SATURATION]: 0,
        [PROPS.USER.COLOR.PRIMARY_HUE]: 0,
      } as any,
      palette: colors.gray,
    };

  return byPalette[player.color]!;
}
