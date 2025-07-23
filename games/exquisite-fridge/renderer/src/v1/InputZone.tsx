import { Box, Button, clsx, Icon } from '@a-type/ui';
import { genericId } from '@long-game/common';
import {
  isValidFreebie,
  WordItem,
} from '@long-game/game-exquisite-fridge-definition/v1';
import {
  moveItem,
  SortableTokenList,
  TokenSpace,
  TurnError,
} from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { WordTile } from './WordTile.js';
import { collectInput } from './WriteInDialog.js';

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
          //debug
          onMove={async (token, index) => {
            let wordData = token.data;
            if (!token.data.text) {
              // If the token is a blank tile, prompt for input
              const word = await collectInput();
              if (!word) {
                return;
              }
              wordData = { ...token.data, text: word };
            }
            if (
              isValidFreebie(wordData.text) &&
              wordData.id.startsWith('freebie-')
            ) {
              // rewrite ids of freebies before placing
              wordData = {
                ...wordData,
                id: genericId(),
              };
            }
            gameSuite.prepareTurn((cur) => ({
              words: moveItem(cur.words, wordData, index),
            }));
          }}
          full="width"
          gap="sm"
          p="md"
          disabled={turnWasSubmitted}
          priority={1}
        >
          {currentTurn.words.map((word) => (
            <WordTile value={word} key={word.id} movedBehavior="remove" />
          ))}
        </SortableTokenList>
        <TokenSpace<WordItem>
          id="append-area"
          onDrop={async (token) => {
            let wordData = token.data;
            if (!token.data.text) {
              // If the token is a blank tile, prompt for input
              const word = await collectInput();
              if (word) {
                wordData = { ...token.data, text: word };
              } else {
                return; // User cancelled input
              }
            }
            if (isValidFreebie(wordData.text)) {
              // rewrite ids of freebies before placing
              wordData = {
                ...wordData,
                id: genericId(),
              };
            }
            gameSuite.prepareTurn((cur) => ({
              ...cur,
              words: [
                ...cur.words.filter((w) => w.id !== token.data.id),
                wordData,
              ],
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
