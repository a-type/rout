import { Box, Button, H4, Icon, Input, ScrollArea } from '@a-type/ui';
import { useLocalStorage } from '@long-game/game-client';
import {
  freebieWords,
  WordItem,
} from '@long-game/game-exquisite-fridge-definition/v1';
import { TokenSpace } from '@long-game/game-ui';
import { useState } from 'react';
import { hooks } from './gameClient.js';
import { WordTile } from './WordTile.js';

export interface WordHandProps {
  className?: string;
}

export const WordHand = hooks.withGame<WordHandProps>(function WordHand({
  gameSuite,
  className,
}) {
  const {
    finalState: { hand },
    currentTurn: { words },
  } = gameSuite;
  const usedIds = new Set(words.map((w) => w.id));

  const [sortOrder, setSortOrder] = useLocalStorage<'alpha-asc' | 'alpha-desc'>(
    'exquisite-fridge-sort-order',
    'alpha-asc',
  );
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'alpha-asc' ? 'alpha-desc' : 'alpha-asc'));
  };
  const [filter, setFilter] = useState('');

  return (
    <Box full="width" className={className} asChild>
      <TokenSpace<WordItem>
        id="hand"
        onDrop={(token) => {
          gameSuite.prepareTurn((cur) => ({
            words: cur.words.filter((w) => w.id !== token.id),
          }));
        }}
        disabled={gameSuite.turnWasSubmitted}
      >
        <ScrollArea className="px-[50px] md:px-0 w-full h-full">
          <H4 className="text-center mb-xs">Free tiles</H4>
          <FreebieWords className="mb-md" />
          <H4 className="text-center mb-xs">Your pile</H4>
          <Box surface="default" gap="sm" p="sm" wrap className="mb-sm">
            <Button
              size="small"
              toggled={sortOrder === 'alpha-asc'}
              toggleMode="state-only"
              onClick={toggleSortOrder}
            >
              <Icon
                name={sortOrder === 'alpha-asc' ? 'arrowUp' : 'arrowDown'}
              />
              {sortOrder === 'alpha-asc' ? 'a-z' : 'z-a'}
            </Button>
            <Input
              placeholder="Filter..."
              value={filter}
              sizeVariant="small"
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 min-w-4ch"
              aria-label="Filter words"
              name="filter-words"
              size={4}
            />
          </Box>
          <Box gap wrap full="width" layout="center start" className="pb-md">
            {hand
              .filter((handWord) => !usedIds.has(handWord.id))
              .filter(
                (word) =>
                  !filter ||
                  word.text.toLowerCase().includes(filter.toLowerCase()),
              )
              .sort((a, b) =>
                sortOrder === 'alpha-asc'
                  ? a.text.localeCompare(b.text)
                  : b.text.localeCompare(a.text),
              )
              .map((word) => (
                <WordTile value={word} key={word.id} />
              ))}
          </Box>
        </ScrollArea>
      </TokenSpace>
    </Box>
  );
});

function FreebieWords({ className }: { className?: string }) {
  return (
    <Box gap="sm" wrap full="width" layout="center start" className={className}>
      {freebieWords.map((word) => (
        <WordTile
          key={word}
          value={{
            id: `freebie-${word}`,
            text: word,
            isWriteIn: false,
            isNew: false,
          }}
          className="bg-yellow-200"
          disableChat
        />
      ))}
    </Box>
  );
}
