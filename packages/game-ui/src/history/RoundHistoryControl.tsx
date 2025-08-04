import { Box, Button, Icon, Select, Spinner } from '@a-type/ui';
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
      startTransition(async () => {
        await suite.loadRoundUnsuspended(index);
        suite.showRound(index);
        // preload adjacent rounds if any
        if (index > 0) {
          suite.loadRoundUnsuspended(index - 1);
        }
        if (index < latestRoundIndex) {
          suite.loadRoundUnsuspended(index + 1);
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
          className="p-sm"
        >
          <Icon name="previous" size={10} />
        </Button>

        <Select
          value={roundIndex.toString()}
          onValueChange={(v) => {
            const asInt = parseInt(v, 10);
            loadRound(asInt);
          }}
        >
          <Select.Trigger size="small" className="px-md">
            <Select.Value />
            {transitioning ? <Spinner size={12} /> : <Select.Icon />}
          </Select.Trigger>
          <Select.Content>
            {/* Note: specifically skipping latest index, which === current */}
            {Array.from({ length: latestRoundIndex + 1 }).map((_, i) => (
              <Select.Item key={i} value={i.toString()}>
                {suite.gameDefinition.getRoundLabel?.({
                  roundIndex: i,
                  members: suite.members,
                }) ?? `Round ${i + 1}`}
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
          className="p-sm"
          disabled={isCurrent}
        >
          <Icon name="next" size={10} />
        </Button>
        <Button
          size="icon-small"
          onClick={() => {
            loadRound(latestRoundIndex);
          }}
          disabled={isCurrent}
          className={isCurrent ? 'hidden' : 'p-sm'}
        >
          <Icon name="skipEnd" size={10} />
        </Button>
      </Box>
    );
  },
);
