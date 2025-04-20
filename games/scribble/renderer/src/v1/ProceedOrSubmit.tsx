import { Box, Button, Icon } from '@a-type/ui';
import { useDebounced } from '@long-game/game-client';
import { hooks } from './gameClient';
import { gameplayState } from './gameplayState';

export interface ProceedOrSubmitProps {
  taskIndex: number;
}

export const ProceedOrSubmit = hooks.withGame<ProceedOrSubmitProps>(
  function ProceedOrSubmit({ gameSuite, taskIndex: index }) {
    const {
      canSubmitTurn,
      submitTurn,
      currentTurn,
      turnWasSubmitted,
      turnError,
    } = gameSuite;
    const tasksCompleted = (currentTurn?.taskCompletions ?? []).map(Boolean);
    const otherTask = index === 0 ? 1 : 0;
    const hasBothTasks = currentTurn?.taskCompletions.length === 2;
    const showSubmit = hasBothTasks || tasksCompleted[otherTask];
    const willSubmit = showSubmit && canSubmitTurn;
    const submitted = turnWasSubmitted && !canSubmitTurn;
    const actionableError =
      canSubmitTurn && tasksCompleted[0] && tasksCompleted[1]
        ? turnError
        : undefined;

    const debouncedError = useDebounced(
      actionableError,
      1000,
      !actionableError,
    );

    return (
      <Box d="col" items="center" gap>
        {debouncedError && (
          <Box p gap items="center" className="text-attention-ink">
            <Icon name="lightbulb" />
            {debouncedError}
          </Box>
        )}
        <Button
          color={submitted ? 'ghost' : 'primary'}
          onClick={() => {
            if (willSubmit) {
              submitTurn();
            } else {
              gameplayState.viewingIndex = index === 0 ? 1 : 0;
            }
          }}
          disabled={
            submitted ||
            !canSubmitTurn ||
            !!actionableError ||
            !tasksCompleted[index]
          }
        >
          {actionableError
            ? "Can't submit"
            : submitted
            ? 'Ready for next!'
            : willSubmit
            ? 'Finish turn'
            : 'Next'}
          <Icon
            name={
              actionableError
                ? 'warning'
                : submitted || willSubmit
                ? 'check'
                : 'arrowRight'
            }
          />
        </Button>
      </Box>
    );
  },
);
