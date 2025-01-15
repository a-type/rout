import { Button } from '@a-type/ui';
import { hooks } from '../hooks';

export interface SubmitTurnProps {}

export function SubmitTurn({}: SubmitTurnProps) {
  const submit = hooks.useSubmitTurn();
  const { data: currentTurn } = hooks.useGetCurrentTurn();

  return (
    <Button
      className="items-center justify-center text-xl"
      color={currentTurn.error ? 'destructive' : 'primary'}
      disabled={!!currentTurn.error || !currentTurn.local}
      onClick={() => submit.mutate(undefined)}
    >
      Submit Turn
    </Button>
  );
}
