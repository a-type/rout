import { Button, Icon } from '@a-type/ui';
import { Orientation } from '@long-game/game-gunboats-definition/v1';
import { actionState, useActionState } from './actionState';

export interface ActionOrientationControlProps {
  className?: string;
}

export function ActionOrientationControl({
  className,
}: ActionOrientationControlProps) {
  const { position, orientation, action } = useActionState();

  if (!action || action.type === 'fire' || !position) {
    return null;
  }

  return (
    <Button
      size="icon-small"
      color="default"
      className={className}
      style={{
        position: 'absolute',
        top: `calc(var(--cell-size) * ${position.y} - var(--cell-size) / 2)`,
        left: `calc(var(--cell-size) * ${position.x} - var(--cell-size) / 2)`,
        zIndex: 10,
      }}
      onClick={() => {
        actionState.orientation = ((actionState.orientation + 1) %
          4) as Orientation;
      }}
    >
      <Icon name="refresh" />
    </Button>
  );
}
