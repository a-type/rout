import { Box, clsx, PROPS } from '@a-type/ui';
import { colors, PrefixedId } from '@long-game/common';
import { Drawing } from '@long-game/game-scribble-definition/v1';
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
      d="col"
      gap="xs"
      items="center"
      full="width"
      container="reset"
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
        className={clsx('theme', 'override-light')}
      />
      {(forceAttribution || playerId !== gameSuite.playerId) && (
        <Box
          gap
          p="sm"
          items="center"
          className="mx-auto text-xs color-gray-dark"
        >
          Drawing by <PlayerAttribution playerId={playerId} />
        </Box>
      )}
    </Box>
  );
});
