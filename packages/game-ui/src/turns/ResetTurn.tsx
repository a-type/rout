import { Button, ButtonProps, Icon } from '@a-type/ui';
import { withGame } from '@long-game/game-client';

export interface ResetTurnProps extends ButtonProps {}

export const ResetTurn = withGame<ResetTurnProps>(function ResetTurn({
  gameSuite,
  children,
  ...rest
}) {
  return (
    <Button
      onClick={() => gameSuite.prepareTurn(null)}
      disabled={!gameSuite.hasLocalTurn && !gameSuite.turnWasSubmitted}
      {...rest}
    >
      {children || (
        <>
          <Icon name="refresh" />
          Reset
        </>
      )}
    </Button>
  );
});
