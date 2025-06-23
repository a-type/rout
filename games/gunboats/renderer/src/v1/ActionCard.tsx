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
      className="@container min-h-[40px] min-w-[30px] aspect-3/4"
      surface="default"
      border
      layout="center center"
    >
      <div>{action.type}</div>
    </Box>
  );
});
