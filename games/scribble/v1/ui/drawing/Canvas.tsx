import { Box, userModeProps } from '@a-type/ui';
import { colors, Drawing, PrefixedId } from '@long-game/common';
import { DrawCanvas } from '@long-game/game-ui/drawing';
import { hooks } from '../gameClient.js';
import { PlayerAttribution } from '../PlayerAttribution.js';

export interface CanvasProps {
  readonly?: boolean;
  drawing: Drawing;
  playerId: PrefixedId<'u'>;
  onChange?: (value: Drawing) => void;
  className?: string;
  forceAttribution?: boolean;
}

export const Canvas = hooks.withGame<CanvasProps>(function Canvas({
  readonly,
  drawing,
  gameSuite,
  playerId,
  onChange,
  className,
  forceAttribution,
}) {
  const player = gameSuite.getPlayer(playerId);
  const palette = colors[player.color];

  return (
    <Box
      col
      gap="xs"
      items="center"
      full="width"
      container
      className={className}
      p
    >
      <DrawCanvas
        readonly={readonly}
        drawing={drawing}
        onChange={onChange}
        style={
          {
            [userModeProps.$userColorHue]: palette.okHue,
            [userModeProps.$userColorSaturation]: palette.okSaturation,
          } as any
        }
        className="@mode-light @mode-user"
      />
      {(forceAttribution || playerId !== gameSuite.playerId) && (
        <Box
          gap
          p="sm"
          items="center"
          dim
          style={{ marginInline: 'auto' }}
          className="@mode-dense"
        >
          Drawing by <PlayerAttribution playerId={playerId} />
        </Box>
      )}
    </Box>
  );
});
