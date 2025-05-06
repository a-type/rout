import { Box, Button, Icon } from '@a-type/ui';
import { useDebounced } from '@long-game/game-client';
import { SubmitTurn } from '@long-game/game-ui';
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

    if (showSubmit) {
      return <SubmitTurn />;
    }

    return (
      <Box d="col" items="center" gap>
        {debouncedError && (
          <Box p gap items="center" className="text-attention-ink">
            <Icon name="lightbulb" />
            {debouncedError}
          </Box>
        )}
        <Button
          color="primary"
          onClick={() => {
            gameplayState.viewingIndex = index === 0 ? 1 : 0;
          }}
          disabled={!tasksCompleted[index]}
        >
          Next
          <Icon name="arrowRight" />
        </Button>
      </Box>
    );
  },
);
