import { Box, PROPS } from '@a-type/ui';
import { colors, PrefixedId } from '@long-game/common';
import { DrawCanvas } from '@long-game/game-ui/drawing';
import { Drawing } from '../../definition/index';
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
            [PROPS.USER.COLOR.PRIMARY_HUE]: palette.okHue,
            [PROPS.USER.COLOR.ACCENT_HUE]: palette.okHue,
          } as any
        }
        className="@mode-light"
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
