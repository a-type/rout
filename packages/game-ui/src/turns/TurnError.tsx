import { Box, BoxProps, Button, CollapsibleSimple, Icon } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { BaseTurnError } from '@long-game/game-definition';

export interface TurnErrorProps<TErr> extends BoxProps {
  showReset?: boolean;
  renderError?: (error: TErr) => React.ReactNode;
}

export const TurnError = withGame<TurnErrorProps<BaseTurnError>>(
  function TurnError({
    showReset,
    renderError = (error: BaseTurnError) => error.message,
    gameSuite: suite,
    ...props
  }) {
    const err = suite.turnError;

    return (
      <CollapsibleSimple open={!!err}>
        <Box items="center" {...props}>
          {err && renderError(err)}
          {showReset && (
            <Button
              color="attention"
              emphasis="ghost"
              onClick={() => suite.prepareTurn(null)}
              className="ml-auto"
            >
              <Icon name="refresh" /> Reset
            </Button>
          )}
        </Box>
      </CollapsibleSimple>
    );
  },
);
