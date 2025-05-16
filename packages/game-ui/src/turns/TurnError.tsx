import { Box, BoxProps, Button, Icon } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';

export interface TurnErrorProps extends BoxProps {
  showReset?: boolean;
}

export const TurnError = withGame(function TurnError({
  showReset,
  ...props
}: TurnErrorProps) {
  const suite = useGameSuite();

  if (suite.turnError) {
    return (
      <Box items="center" {...props}>
        {suite.turnError}
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
    );
  }

  return null;
});
