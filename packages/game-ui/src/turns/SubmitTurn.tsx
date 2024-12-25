import { Button } from '@a-type/ui';
import { useCurrentTurn } from '@long-game/game-client/client';

export interface SubmitTurnProps {}

export function SubmitTurn({}: SubmitTurnProps) {
  const currentTurn = useCurrentTurn();

  return (
    <Button
      className="items-center justify-center text-xl"
      color={currentTurn.error ? 'destructive' : 'primary'}
      disabled={!!currentTurn.error || !currentTurn.dirty}
      onClick={() => currentTurn.submitTurn()}
    >
      Submit Turn
    </Button>
  );
}
