import { Button, Tooltip } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';

export interface SubmitTurnProps {}

export const SubmitTurn = withGame(function SubmitTurn({}: SubmitTurnProps) {
  const suite = useGameSuite();

  return (
    <Tooltip disabled={!suite.turnError} content={suite.turnError}>
      <Button
        className="items-center justify-center"
        color={suite.turnError ? 'destructive' : 'primary'}
        disabled={!!suite.turnError || !suite.canSubmitTurn}
        onClick={() => suite.submitTurn()}
      >
        {suite.turnWasSubmitted ? 'Update' : 'Submit'} Turn
      </Button>
    </Tooltip>
  );
});
