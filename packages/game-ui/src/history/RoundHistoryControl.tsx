import { Box, Button, Icon, Select } from '@a-type/ui';
import { useGameSuite, withGame } from '@long-game/game-client';
import { useTransition } from 'react';

export interface RoundHistoryControlProps {}

export const RoundHistoryControl = withGame(
  function RoundHistoryControl({}: RoundHistoryControlProps) {
    const suite = useGameSuite();

    const roundIndex = suite.viewingRoundIndex;
    const latestRoundIndex = suite.latestRoundIndex;
    const isCurrent = suite.isViewingCurrentRound;

    const [transitioning, startTransition] = useTransition();

    const loadRound = (index: number) => {
      startTransition(() => {
        suite.loadRound(index);
      });
    };

    return (
      <Box layout="center center">
        <Button
          size="icon-small"
          onClick={() => {
            loadRound(roundIndex - 1);
          }}
          disabled={roundIndex === 0}
        >
          <Icon name="arrowLeft" />
        </Button>

        <Select
          value={roundIndex.toString()}
          onValueChange={(v) => {
            const asInt = parseInt(v, 10);
            loadRound(asInt);
          }}
        >
          <Select.Trigger size="small" />
          <Select.Content>
            {/* Note: specifically skipping latest index, which === current */}
            {Array.from({ length: latestRoundIndex + 1 }).map((_, i) => (
              <Select.Item key={i} value={i.toString()}>
                Round {i + 1}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Button
          size="icon-small"
          onClick={() => {
            if (isCurrent) {
              return;
            }
            loadRound(roundIndex + 1);
          }}
          disabled={isCurrent}
        >
          <Icon name="arrowRight" />
        </Button>
        <Button
          size="icon-small"
          onClick={() => {
            loadRound(latestRoundIndex);
          }}
          disabled={isCurrent}
          className={isCurrent ? 'hidden' : ''}
        >
          <Icon name="arrowRight" />
        </Button>
      </Box>
    );
  },
);
