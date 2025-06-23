import { Box, Button } from '@a-type/ui';
import {
  getActionTaken,
  resetActionState,
  useActiveAction,
} from './actionState';
import { hooks } from './gameClient';

export interface ActiveActionHudProps {
  className?: string;
}

export const ActiveActionHud = hooks.withGame<ActiveActionHudProps>(
  function ActiveActionHud({ className, gameSuite }) {
    const action = useActiveAction();

    const completeAction = () => {
      gameSuite.prepareTurn((cur) => {
        const taken = getActionTaken();
        cur.actions.push(taken);
        resetActionState();
        return cur;
      });
    };

    if (!action) {
      return null;
    }

    return (
      <Box gap items="center" className={className} surface="accent" p>
        {action.type === 'ship' ? (
          <>
            <strong>Ship Action:</strong> {action.shipLength}
          </>
        ) : action.type === 'move' ? (
          <>
            <strong>Move Action</strong>
          </>
        ) : action.type === 'fire' ? (
          <>
            <strong>Fire Action</strong>
          </>
        ) : (
          <strong>Unknown Action</strong>
        )}
        <Button onClick={completeAction} color="primary">
          Done
        </Button>
        <Button onClick={() => resetActionState()} color="default">
          Cancel
        </Button>
      </Box>
    );
  },
);
