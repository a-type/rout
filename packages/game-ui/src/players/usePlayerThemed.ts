import { colors, PrefixedId } from '@long-game/common';
import { useGameSuite } from '@long-game/game-client';

export function usePlayerThemed(playerId?: PrefixedId<'u'> | null) {
  const suite = useGameSuite();

  const player = playerId ? suite.getPlayer(playerId) : null;
  if (!player)
    return {
      className: 'theme',
      style: {
        '--dyn-saturation': 0,
        '--dyn-primary-source': 0,
      } as any,
    };

  const palette = colors[player.color];

  return {
    palette,
    className: 'theme',
    style: {
      '--dyn-primary-source': palette.okHue,
      '--dyn-accent-source': 160,
      '--dyn-primary-sat-mult': palette.okSaturation,
      '--dyn-primary-hue-rotate': palette.okRotate,
      '--dyn-accent-hue-rotate': -2,
    } as any,
  };
}
