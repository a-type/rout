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
      <Box>
        {(roundIndex === 'current' || roundIndex > 0) && (
          <Button
            size="icon-small"
            color="ghost"
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
          value={roundIndex.toString()}
          onValueChange={(v) => {
            if (v === 'current') {
              setRoundIndex('current');
            } else {
              setRoundIndex(parseInt(v, 10));
            }
          }}
        >
          <Select.Trigger />
          <Select.Content>
            {/* Note: specifically skipping latest index, which === current */}
            {Array.from({ length: latestRoundIndex }).map((_, i) => (
              <Select.Item key={i} value={i.toString()}>
                Round {i + 1}
              </Select.Item>
            ))}
            <Select.Item value="current">Latest Round</Select.Item>
          </Select.Content>
        </Select>
        {roundIndex !== 'current' && roundIndex <= lastDisplayedRound && (
          <Button
            size="icon-small"
            color="ghost"
            onClick={() => {
              setRoundIndex(
                roundIndex === lastDisplayedRound ? 'current' : roundIndex + 1,
              );
            }}
          >
            <Icon name="arrowRight" />
          </Button>
        )}
        {roundIndex !== 'current' && (
          <Button
            size="icon-small"
            color="ghost"
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
