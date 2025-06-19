import { Box, BoxProps, Button, CollapsibleSimple, Icon } from '@a-type/ui';
import { useGameSuite } from '@long-game/game-client';
import { BaseTurnError } from '@long-game/game-definition';

export interface TurnErrorProps<TErr> extends BoxProps {
  showReset?: boolean;
  renderError?: (error: TErr) => React.ReactNode;
}

export function TurnError<TErr extends BaseTurnError = BaseTurnError>({
  showReset,
  renderError = (error: TErr) => error.message,
  ...props
}: TurnErrorProps<TErr>) {
  const suite = useGameSuite();
  const err = suite.turnError;

  return (
    <CollapsibleSimple open={!!err}>
      <Box items="center" {...props}>
        {err && renderError(err as TErr)}
        {showReset && (
          <Button
            color="ghostDestructive"
            onClick={() => suite.prepareTurn(null)}
            className="ml-auto"
          >
            <Icon name="refresh" /> Reset
          </Button>
        )}
      </Box>
    </CollapsibleSimple>
  );
}
