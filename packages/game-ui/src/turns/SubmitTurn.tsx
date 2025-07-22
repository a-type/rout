import { Box, Button, clsx, Icon, RelativeTime, Tooltip } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';
import { TopographyButton } from '@long-game/visual-components';
import { ReactNode } from 'react';
import { PlayerStatuses } from '../players/PlayerStatuses.js';
import { withSuspense } from '../withSuspense.js';

export interface SubmitTurnProps {
  className?: string;
  children?: ReactNode;
  delay?: number;
}

export const SubmitTurn = withSuspense(
  withGame(function SubmitTurn({
    className,
    children,
    delay,
  }: SubmitTurnProps) {
    const {
      turnError,
      hasLocalTurn,
      submitTurn,
      turnWasSubmitted,
      nextRoundCheckAt,
      canSubmitTurn,
    } = useGameSuite();

    const isDisabled = !!turnError || !hasLocalTurn || !canSubmitTurn;
    const icon = turnError
      ? 'warning'
      : nextRoundCheckAt
        ? 'clock'
        : !hasLocalTurn && turnWasSubmitted
          ? 'check'
          : 'arrowRight';
    const hideIcon = !hasLocalTurn && !turnWasSubmitted && !nextRoundCheckAt;

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
        <Box className={clsx('rounded-lg', className)}>
          <TopographyButton
            className="items-center justify-center w-full h-full disabled:(opacity-100 bg-wash color-gray border-gray)"
            color={turnError ? 'destructive' : 'primary'}
            disabled={isDisabled}
            onClick={() =>
              submitTurn({
                delay,
              })
            }
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
            {!children && !hideIcon && <Icon name={icon} />}
          </TopographyButton>
          <PlayerStatuses className="absolute z-100 pointer-events-none bottom-0 left-50% -translate-x-1/2 translate-y-2/3" />
        </Box>
      </Tooltip>
    );
  }),
  <Button disabled>Submit Turn</Button>,
);
