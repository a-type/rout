import { Box, Button, H4, Icon, Input } from '@a-type/ui';
import { useLocalStorage } from '@long-game/game-client';
import { HelpSurface, TokenSpace } from '@long-game/game-ui';
import { memo, startTransition, useState } from 'react';
import { freebieWords, WordItem } from '../definition/index';
import { hooks } from './gameClient.js';
import cls from './WordHand.module.css';
import { WordTile as UnmemoizedWordTile } from './WordTile.js';

const WordTile = memo(UnmemoizedWordTile);

export interface WordHandProps {
  className?: string;
}

export const WordHand = hooks.withGame<WordHandProps>(function WordHand({
  gameSuite,
  className,
}) {
  const {
    initialState: { hand },
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
    <Box
      full="width"
      container
      className={className}
      render={
        <TokenSpace<WordItem>
          id="hand"
          onDrop={(token) => {
            startTransition(() => {
              gameSuite.prepareTurn((cur) => ({
                words: cur.words.filter((w) => w.id !== token.id),
              }));
            });
          }}
          disabled={gameSuite.turnWasSubmitted}
          priority={-1}
        />
      }
    >
      <Box col className={cls.main}>
        <H4 className={cls.title}>Free tiles</H4>
        <FreebieWords className={cls.section} />
        <H4 className={cls.title}>Your pile</H4>
        <Box surface gap="sm" p="sm" wrap className={cls.section}>
          <Button
            size="small"
            toggled={sortOrder === 'alpha-asc'}
            toggleMode="state-only"
            onClick={toggleSortOrder}
          >
            <Icon name={sortOrder === 'alpha-asc' ? 'arrowUp' : 'arrowDown'} />
            {sortOrder === 'alpha-asc' ? 'a-z' : 'z-a'}
          </Button>
          <Input
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={cls.input}
            aria-label="Filter words"
            name="filter-words"
            size={4}
          />
        </Box>
        <Box
          gap="md"
          wrap
          full="width"
          layout="center start"
          className={cls.section}
        >
          {hand
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
              <WordTile
                value={word}
                key={word.id}
                used={usedIds.has(word.id)}
              />
            ))}
        </Box>
      </Box>
    </Box>
  );
});

function FreebieWords({ className }: { className?: string }) {
  return (
    <HelpSurface
      id="freebie-words"
      rulesId="free-words"
      content={<div>You can use as many of these as you like.</div>}
      title="Free Tiles"
      render={
        <Box
          gap="md"
          wrap
          full="width"
          layout="center start"
          className={className}
        />
      }
    >
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
    </HelpSurface>
  );
}
