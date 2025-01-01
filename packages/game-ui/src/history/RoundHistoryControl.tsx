import { Box, Button, Icon, Select } from '@a-type/ui';
import { useGameSession } from '@long-game/game-client/client';
import { useViewingRoundIndex } from '../../../game-client/src/client/GameHistoryContext.js';

export interface RoundHistoryControlProps {}

export function RoundHistoryControl({}: RoundHistoryControlProps) {
  const [roundIndex, setRoundIndex] = useViewingRoundIndex();
  const {
    state: { currentRoundIndex: latestRoundIndex },
  } = useGameSession();

  return (
    <Box>
      {(roundIndex === 'current' || roundIndex > 0) && (
        <Button
          size="icon-small"
          color="ghost"
          onClick={() => {
            setRoundIndex(
              roundIndex === 'current' ? latestRoundIndex - 1 : roundIndex - 1,
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
      {roundIndex !== 'current' && roundIndex < latestRoundIndex && (
        <Button
          size="icon-small"
          color="ghost"
          onClick={() => {
            setRoundIndex(
              roundIndex === latestRoundIndex - 1 ? 'current' : roundIndex + 1,
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
}
