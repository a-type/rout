import { Box, Button, Tooltip } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';
import { TopographyButton } from '@long-game/visual-components';
import { ReactNode } from 'react';
import { PlayerStatuses } from '../players/PlayerStatuses';
import { withSuspense } from '../withSuspense';

export interface SubmitTurnProps {
  className?: string;
  children?: ReactNode;
}

export const SubmitTurn = withSuspense(
  withGame(function SubmitTurn({ className, children }: SubmitTurnProps) {
    const { turnError, canSubmitTurn, submitTurn, turnWasSubmitted } =
      useGameSuite();

    return (
      <Tooltip disabled={!turnError} content={turnError}>
        <Box className={className}>
          <TopographyButton
            className="items-center justify-center w-full h-full"
            color={turnError ? 'destructive' : 'primary'}
            disabled={!!turnError || !canSubmitTurn}
            onClick={() => submitTurn()}
          >
            {children ?? `${turnWasSubmitted ? 'Update' : 'Submit'} Turn`}
          </TopographyButton>
          <PlayerStatuses className="absolute z-100 pointer-events-none bottom-0 left-50% -translate-x-1/2 translate-y-2/3" />
        </Box>
      </Tooltip>
    );
  }),
  <Button disabled>Submit Turn</Button>,
);
