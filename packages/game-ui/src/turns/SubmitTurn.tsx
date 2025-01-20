import { Button } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';

export interface SubmitTurnProps {}

export const SubmitTurn = withGame(function SubmitTurn({}: SubmitTurnProps) {
  const suite = useGameSuite();

  return (
    <Button
      className="items-center justify-center"
      color={suite.turnError ? 'destructive' : 'primary'}
      disabled={!!suite.turnError || suite.turnWasSubmitted}
      onClick={() => suite.submitTurn()}
    >
      Submit Turn
    </Button>
  );
});
