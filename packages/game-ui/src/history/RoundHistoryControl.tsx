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
        suite.showRound(index);
        // preload adjacent rounds if any
        if (index > 0) {
          suite.loadRound(index - 1).catch(() => {});
        }
        if (index < latestRoundIndex) {
          suite.loadRound(index + 1).catch(() => {});
        }
      });
    };

    return (
      <Box layout="center center" gap="sm">
        <Button
          size="icon-small"
          onClick={() => {
            loadRound(roundIndex - 1);
          }}
          disabled={roundIndex === 0}
        >
          <Icon name="previous" />
        </Button>

        <Select
          value={roundIndex.toString()}
          onValueChange={(v) => {
            const asInt = parseInt(v, 10);
            loadRound(asInt);
          }}
        >
          <Select.Trigger />
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
          <Icon name="next" />
        </Button>
        <Button
          size="icon-small"
          onClick={() => {
            loadRound(latestRoundIndex);
          }}
          disabled={isCurrent}
          className={isCurrent ? 'hidden' : ''}
        >
          <Icon name="skipEnd" />
        </Button>
      </Box>
    );
  },
);
