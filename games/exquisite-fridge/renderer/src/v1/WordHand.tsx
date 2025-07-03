import { Box, ScrollArea } from '@a-type/ui';
import { WordItem } from '@long-game/game-exquisite-fridge-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { WordTile } from './WordTile';

export interface WordHandProps {}

export const WordHand = hooks.withGame<WordHandProps>(function WordHand({
  gameSuite,
}) {
  const {
    finalState: { hand },
    currentTurn: { words },
  } = gameSuite;
  const usedIds = new Set(words.map((w) => w.id));
  return (
    <Box full="width" asChild>
      <TokenSpace<WordItem>
        id="hand"
        onDrop={(token) => {
          gameSuite.prepareTurn((cur) => ({
            words: cur.words.filter((w) => w.id !== token.id),
          }));
        }}
        disabled={gameSuite.turnWasSubmitted}
      >
        <ScrollArea className="px-[10vw] w-full h-full">
          <Box gap wrap p full="width">
            {hand
              .filter((handWord) => !usedIds.has(handWord.id))
              .sort((a, b) => a.text.localeCompare(b.text))
              .map((word) => (
                <WordTile value={word} key={word.id} />
              ))}
          </Box>
        </ScrollArea>
      </TokenSpace>
    </Box>
  );
});
