import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, Chip, clsx, Icon, Select } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { useState } from 'react';
import { GameCard } from '../library/GameCard.js';

export interface GamePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  loading?: boolean;
  gameSessionId: PrefixedId<'gs'>;
}

export function GamePicker({
  value,
  onChange,
  loading,
  gameSessionId,
  className,
  ...rest
}: GamePickerProps) {
  const { data: games } = sdkHooks.useGetGames();
  const allTags = new Set<string>();
  for (const game of Object.values(games)) {
    for (const tag of game.tags) {
      allTags.add(tag);
    }
  }

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

  const { data: me } = sdkHooks.useGetMe();
  const isAdmin = me?.isProductAdmin;

  const { data: availableGames } = sdkHooks.useGetAvailableGames({
    id: gameSessionId,
  });

  const filteredGamesIncludingUnowned = Object.entries(games)
    .filter(([_, game]) => isAdmin || !game.prerelease)
    .filter(([_, game]) => {
      if (filters.tags.length > 0) {
        return filters.tags.some((tag) => game.tags.includes(tag));
      }
      return true;
    });
  const filteredGames = filteredGamesIncludingUnowned.filter(([gameId]) => {
    if (filters.owned && !availableGames.includes(gameId)) {
      return false;
    }
    return true;
  });

  return (
    <Box d="col" gap items="stretch" className={clsx(className)} {...rest}>
      <Box items="center" gap className="flex-wrap" surface="wash" p>
        <Icon name="filter" />
        Filter
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
      <Box className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md p-md">
        {filteredGames.map(([gameId]) => (
          <GameCard
            gameId={gameId}
            onClick={
              availableGames.includes(gameId)
                ? () => onChange(gameId)
                : undefined
            }
            owned={availableGames.includes(gameId)}
            key={gameId}
            selected={gameId === value}
          />
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
