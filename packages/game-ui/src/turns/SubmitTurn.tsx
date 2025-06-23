import { Box, Button, Icon, RelativeTime, Tooltip } from '@a-type/ui';
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
    const {
      turnError,
      hasLocalTurn,
      submitTurn,
      turnWasSubmitted,
      nextRoundCheckAt,
    } = useGameSuite();

    const isDisabled = !!turnError || !hasLocalTurn;
    const icon = turnError
      ? 'warning'
      : nextRoundCheckAt
        ? 'clock'
        : 'arrowRight';

    return (
      <Tooltip
        disabled={!turnError && !nextRoundCheckAt}
        color="contrast"
        content={
          nextRoundCheckAt
            ? `The next round starts at ${nextRoundCheckAt.toLocaleTimeString()} ${nextRoundCheckAt.toLocaleDateString()}`
            : turnError?.message
        }
      >
        <Box className={className}>
          <TopographyButton
            className="items-center justify-center w-full h-full"
            color={turnError ? 'destructive' : 'primary'}
            disabled={isDisabled}
            onClick={() => submitTurn()}
          >
            {children ??
              (!hasLocalTurn && turnWasSubmitted && nextRoundCheckAt ? (
                <>
                  <span>Next:</span>
                  <RelativeTime
                    countdownSeconds
                    value={nextRoundCheckAt.getTime()}
                    abbreviate
                  />
                </>
              ) : turnError ? (
                "Can't submit"
              ) : turnWasSubmitted ? (
                hasLocalTurn ? (
                  `Update turn`
                ) : (
                  'Ready for next!'
                )
              ) : (
                `Submit turn`
              ))}
            {!children && <Icon name={icon} />}
          </TopographyButton>
          <PlayerStatuses className="absolute z-100 pointer-events-none bottom-0 left-50% -translate-x-1/2 translate-y-2/3" />
        </Box>
      </Tooltip>
    );
  }),
  <Button disabled>Submit Turn</Button>,
);
