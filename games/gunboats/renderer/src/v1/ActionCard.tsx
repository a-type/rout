import { Box } from '@a-type/ui';
import { Action } from '@long-game/game-gunboats-definition/v1';
import { hooks } from './gameClient';

export interface ActionCardProps {
  action: Action;
}

export const ActionCard = hooks.withGame<ActionCardProps>(function ActionCard({
  gameSuite,
  action,
}) {
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
