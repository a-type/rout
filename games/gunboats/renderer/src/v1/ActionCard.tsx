import { Box, Icon } from '@a-type/ui';
import { assert } from '@long-game/common';
import { Action } from '@long-game/game-gunboats-definition/v1';
import { useIsDragPreview } from '@long-game/game-ui';
import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { CELL_SIZE } from './constants';
import { hooks } from './gameClient';
import { zoomGlobal } from './viewportGlobals';

export interface ActionCardProps {
  action: Action;
}

export const ActionCard = hooks.withGame<ActionCardProps>(function ActionCard({
  gameSuite,
  action,
}) {
  const isDragging = useIsDragPreview();

  if (isDragging) {
    return <DraggingContent action={action} />;
  }

  return (
    <Box
      container="reset"
      className="@container min-h-[60px] min-w-[40px] aspect-3/4"
    >
      <Box
        full
        surface="default"
        border
        layout="center center"
        className="rounded-sm @md:rounded-lg"
      >
        <div className="text-xs absolute top-xs left-xs">{action.type}</div>
        {action.type === 'ship' && (
          <div className="text-xs absolute bottom-xs right-xs">
            {action.shipLength}
          </div>
        )}
      </Box>
    </Box>
  );
});

function DraggingContent({ action }: { action: Action }) {
  let content: ReactNode;
  switch (action.type) {
    case 'ship':
      content = <DraggingShipContent action={action} />;
      break;
    case 'fire':
      content = <DraggingFireContent action={action} />;
      break;
    default:
      content = null;
      break;
  }

  // scales the drop preview down to match the size of the board.
  return (
    <motion.div
      style={{
        scale: zoomGlobal,
      }}
    >
      {content}
    </motion.div>
  );
}

function DraggingShipContent({ action }: { action: Action }) {
  assert(action.type === 'ship', 'Expected action to be a ship action');

  return (
    <div
      className="bg-primary"
      style={{
        width: `${CELL_SIZE * action.shipLength}px`,
        height: `${CELL_SIZE}px`,
      }}
    />
  );
}

function DraggingFireContent({ action }: { action: Action }) {
  assert(action.type === 'fire', 'Expected action to be a fire action');

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: `${CELL_SIZE}px`,
        height: `${CELL_SIZE}px`,
      }}
    >
      <Icon name="locate" className="w-full h-full" />
    </div>
  );
}
