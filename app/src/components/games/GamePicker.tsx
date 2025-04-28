import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  Card,
  Chip,
  clsx,
  Icon,
  ScrollArea,
  Select,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import games from '@long-game/games';
import { useState } from 'react';

export interface GamePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  loading?: boolean;
  gameSessionId: PrefixedId<'gs'>;
}

const allTags = new Set<string>();
for (const game of Object.values(games)) {
  for (const tag of game.tags) {
    allTags.add(tag);
  }
}

export function GamePicker({
  value,
  onChange,
  loading,
  gameSessionId,
  className,
  ...rest
}: GamePickerProps) {
  const [filters, setFilters] = useState({
    tags: [] as string[],
    owned: true,
  });

  const removeTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };
  const addTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));
  };
  const toggleOwnedFilter = () => {
    setFilters((prev) => ({
      ...prev,
      owned: !prev.owned,
    }));
  };

  const { data: availableGames } = sdkHooks.useGetAvailableGames({
    id: gameSessionId,
  });

  const filteredGamesIncludingUnowned = Object.entries(games).filter(
    ([gameId, game]) => {
      if (filters.tags.length > 0) {
        return filters.tags.some((tag) => game.tags.includes(tag));
      }
      return true;
    },
  );
  const filteredGames = filteredGamesIncludingUnowned.filter(
    ([gameId, game]) => {
      if (filters.owned && !availableGames.includes(gameId)) {
        return false;
      }
      return true;
    },
  );

  return (
    <Box d="col" gap items="stretch" className={clsx(className)} {...rest}>
      <Box items="center" gap className="flex-wrap">
        <span>Filters:</span>
        <Chip asChild color={filters.owned ? 'primary' : 'neutral'}>
          <Button
            size="small"
            color="unstyled"
            toggled={filters.owned}
            onClick={toggleOwnedFilter}
          >
            Owned
          </Button>
        </Chip>
        {filters.tags.map((tag) => (
          <Chip
            key={tag}
            color="primary"
            className="cursor-pointer"
            onClick={() => {
              removeTagFilter(tag);
            }}
          >
            {tag}
            <Icon name="x" />
          </Chip>
        ))}
        <Select value="" onValueChange={addTagFilter}>
          <Select.Trigger size="small" asChild>
            <Chip>
              <Icon name="plus" />
              <Select.Value placeholder="Tag" />
            </Chip>
          </Select.Trigger>
          <Select.Content>
            {Array.from(allTags)
              .filter((tag) => !filters.tags.includes(tag))
              .map((tag) => (
                <Select.Item key={tag} value={tag}>
                  {tag}
                </Select.Item>
              ))}
          </Select.Content>
        </Select>
      </Box>
      <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-md">
        {filteredGames.map(([gameId, game]) => (
          <Card key={gameId} className="aspect-1">
            <Card.Image>
              <img
                src={`/game-icons/${gameId}.png`}
                alt={`${game.title} icon`}
                className="w-full h-full object-cover"
              />
            </Card.Image>
            <Card.Main
              onClick={
                availableGames.includes(gameId)
                  ? () => onChange(gameId)
                  : undefined
              }
            >
              <Card.Title className="flex-shrink-0">{game.title}</Card.Title>
              <Card.Content className="flex-shrink-1 min-h-0">
                <ScrollArea>{game.description}</ScrollArea>
              </Card.Content>
              <Card.Content
                unstyled
                className="text-xs flex flex-row gap-xs flex-wrap"
              >
                {game.tags.map((tag) => (
                  <Chip color="primary">{tag}</Chip>
                ))}
              </Card.Content>
            </Card.Main>
            {!availableGames.includes(gameId) && (
              <Card.Actions>
                <Button color="accent" size="small">
                  <Icon name="cart" /> Buy
                </Button>
              </Card.Actions>
            )}
          </Card>
        ))}
      </Box>
      {!filteredGames.length && (
        <Box full="width" layout="center center" className="color-gray-dark">
          {filters.owned ? (
            <Box d="col" items="center" gap>
              No games owned by a player match these filters.
              {filteredGamesIncludingUnowned.length ? (
                <Button size="small" color="ghost" onClick={toggleOwnedFilter}>
                  But there are {filteredGamesIncludingUnowned.length} matching
                  games on the store <Icon name="arrowRight" />
                </Button>
              ) : (
                ''
              )}
            </Box>
          ) : (
            <>No games match these filters.</>
          )}
        </Box>
      )}
    </Box>
  );
}
