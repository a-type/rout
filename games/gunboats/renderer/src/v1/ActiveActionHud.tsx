import { Box, Button, clsx, CollapsibleSimple } from '@a-type/ui';
import { ResetTurn, SubmitTurn } from '@long-game/game-ui';
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

    const show =
      !!action || gameSuite.canSubmitTurn || gameSuite.turnWasSubmitted;

    if (!show) {
      return null;
    }

    return (
      <Box
        col
        border
        className={clsx('max-w-600px w-80vw', className)}
        surface={error ? 'attention' : 'accent'}
        p
      >
        {!!action ? (
          <>
            <div>
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
            </div>
            <Box gap items="center">
              <Button onClick={() => resetActionState()} color="default">
                Cancel
              </Button>
              <Button
                onClick={completeAction}
                color="primary"
                disabled={!!error}
                className="flex-1 justify-center"
              >
                Done
              </Button>
            </Box>
            <CollapsibleSimple
              open={!!error}
              className={clsx(error ? 'mt-md' : 'mt-0', 'transition-margin')}
            >
              {error?.message}
            </CollapsibleSimple>
          </>
        ) : (
          <SubmitControls />
        )}
      </Box>
    );
  },
);

const SubmitControls = hooks.withGame(function SubmitControls({ gameSuite }) {
  return (
    <Box gap items="center">
      <ResetTurn />
      <SubmitTurn delay={5000} className="flex-1" />
    </Box>
  );
});
