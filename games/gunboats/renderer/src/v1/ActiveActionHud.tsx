import { Box, Button, clsx, CollapsibleSimple } from '@a-type/ui';
import {
  resetActionState,
  useActionTaken,
  useActiveAction,
} from './actionState';
import { hooks } from './gameClient';

export interface ActiveActionHudProps {
  className?: string;
}

export const ActiveActionHud = hooks.withGame<ActiveActionHudProps>(
  function ActiveActionHud({ className, gameSuite }) {
    const action = useActiveAction();
    const taken = useActionTaken();

    const completeAction = () => {
      if (!taken) return;
      gameSuite.prepareTurn((cur) => {
        return {
          ...cur,
          actions: [...cur.actions, taken],
        };
      });
      resetActionState();
    };

    const error = !!taken
      ? gameSuite.validatePartialTurn((cur) => {
          return {
            ...cur,
            actions: [...cur.actions, taken],
          };
        })
      : null;

    if (!action) {
      return null;
    }

    return (
      <Box
        col
        border
        className={className}
        surface={error ? 'attention' : 'accent'}
        p
      >
        <Box gap items="center">
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
          <Button onClick={completeAction} color="primary" disabled={!!error}>
            Done
          </Button>
          <Button onClick={() => resetActionState()} color="default">
            Cancel
          </Button>
        </Box>
        <CollapsibleSimple
          open={!!error}
          className={clsx(error ? 'mt-md' : 'mt-0', 'transition-margin')}
        >
          {error?.message}
        </CollapsibleSimple>
      </Box>
    );
  },
);
