import { Box, Button, clsx, Icon } from '@a-type/ui';
import { WordItem } from '@long-game/game-exquisite-fridge-definition/v1';
import {
  moveItem,
  SortableTokenList,
  TokenSpace,
  TurnError,
} from '@long-game/game-ui';
import { hooks } from './gameClient';
import { WordTile } from './WordTile';

export interface InputZoneProps {
  className?: string;
}

export const InputZone = hooks.withGame<InputZoneProps>(function InputZone({
  gameSuite,
  className,
}) {
  const { currentTurn, turnWasSubmitted } = gameSuite;
  return (
    <Box col gap="sm" className={clsx('w-full', className)}>
      <Box
        col
        layout="stretch start"
        surface
        className={clsx('min-h-20vh w-full shadow-md')}
        border
      >
        <SortableTokenList<WordItem>
          onMove={(token, index) => {
            gameSuite.prepareTurn((cur) => ({
              words: moveItem(cur.words, token.data, index),
            }));
          }}
          full="width"
          gap="sm"
          p="md"
          disabled={turnWasSubmitted}
        >
          {currentTurn.words.map((word) => (
            <WordTile value={word} key={word.id} />
          ))}
        </SortableTokenList>
        <TokenSpace<WordItem>
          id="append-area"
          onDrop={(token) => {
            gameSuite.prepareTurn((cur) => ({
              ...cur,
              words: [...cur.words, token.data],
            }));
          }}
          className="flex-1 min-h-48px"
        />
        {!turnWasSubmitted && (
          <Button
            size="small"
            color="ghost"
            onClick={() => {
              gameSuite.prepareTurn(null);
            }}
            className="absolute bottom-sm right-sm"
          >
            <Icon name="x" />
            Reset
          </Button>
        )}
      </Box>
      <TurnError surface="attention" p justify="center" />
    </Box>
  );
});
