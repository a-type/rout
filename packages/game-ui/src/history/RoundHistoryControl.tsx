import { Box, Button, Icon, Select } from '@a-type/ui';
import {
  useGameSuite,
  useViewingRoundIndex,
  withGame,
} from '@long-game/game-client';

export interface RoundHistoryControlProps {}

export const RoundHistoryControl = withGame(
  function RoundHistoryControl({}: RoundHistoryControlProps) {
    const [roundIndex, setRoundIndex] = useViewingRoundIndex();
    const suite = useGameSuite();

    const latestRoundIndex = suite.roundIndex;
    const lastDisplayedRound = latestRoundIndex - 2;

    return (
      <Box align="center center">
        {(roundIndex === 'current' || roundIndex > 0) && (
          <Button
            size="icon-small"
            onClick={() => {
              setRoundIndex(
                roundIndex === 'current' ? lastDisplayedRound : roundIndex - 1,
              );
            }}
          >
            <Icon name="arrowLeft" />
          </Button>
        )}
        <Select
          value={
            roundIndex === latestRoundIndex ? 'current' : roundIndex.toString()
          }
          onValueChange={(v) => {
            if (v === 'current') {
              setRoundIndex('current');
            } else {
              setRoundIndex(parseInt(v, 10));
            }
          }}
        >
          <Select.Trigger size="small" />
          <Select.Content>
            {/* Note: specifically skipping latest index, which === current */}
            {Array.from({ length: latestRoundIndex - 1 }).map((_, i) => (
              <Select.Item key={i} value={i.toString()}>
                Round {i + 1}
              </Select.Item>
            ))}
            <Select.Item value="current">Round {latestRoundIndex}</Select.Item>
          </Select.Content>
        </Select>
        <Button
          size="icon-small"
          onClick={() => {
            if (roundIndex === 'current') {
              return;
            }
            setRoundIndex(
              roundIndex === lastDisplayedRound ? 'current' : roundIndex + 1,
            );
          }}
          disabled={
            roundIndex === lastDisplayedRound || roundIndex === 'current'
          }
        >
          <Icon name="arrowRight" />
        </Button>
        {roundIndex !== 'current' && (
          <Button
            size="icon-small"
            onClick={() => {
              setRoundIndex('current');
            }}
          >
            <Icon name="arrowRight" />
          </Button>
        )}
      </Box>
    );
  },
);
