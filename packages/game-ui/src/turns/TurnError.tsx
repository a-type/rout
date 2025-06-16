import { Box, BoxProps, Button, CollapsibleSimple, Icon } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';
import { BaseTurnError } from '@long-game/game-definition';

export interface TurnErrorProps<TErr> extends BoxProps {
  showReset?: boolean;
  renderError?: (error: TErr) => React.ReactNode;
}

export const TurnError = withGame(function TurnError({
  showReset,
  renderError = (error: BaseTurnError) => error.message,
  ...props
}: TurnErrorProps<BaseTurnError>) {
  const suite = useGameSuite();
  const err = suite.turnError;

  return (
    <CollapsibleSimple open={!!err}>
      <Box items="center" {...props}>
        {err && renderError(err)}
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
});
