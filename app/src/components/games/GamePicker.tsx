import { sdkHooks } from '@/services/publicSdk';
import {
  AvatarList,
  Box,
  Button,
  Card,
  Chip,
  clsx,
  Icon,
  Select,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { useState } from 'react';
import { GameDetailsDialog } from '../library/GameDetailsDialog.js';
import { useOpenQuickBuy } from '../store/QuickBuyPopup.js';
import { GameIcon } from './GameIcon.js';
import { GameTitle } from './GameTitle.js';

export interface GamePickerProps {
  value: string;
  id?: string;
  className?: string;
  loading?: boolean;
  gameSessionId: PrefixedId<'gs'>;
}

export const GamePicker = withGame<GamePickerProps>(function GamePicker({
  value,
  loading,
  gameSessionId,
  className,
  gameSuite,
  ...rest
}) {
  const { data: pregame } = sdkHooks.useGetGameSessionPregame({
    id: gameSessionId,
  });
  const canSelectGame =
    !pregame.session.createdBy ||
    pregame.session.createdBy === gameSuite.playerId;

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
    <Box
      d="col"
      gap
      items="stretch"
      full="width"
      className={clsx(className)}
      {...rest}
    >
      <Box items="center" gap className="flex-wrap" surface="wash" p>
        <Icon name="filter" />
        Filter
        <Button
          size="small"
          color="accent"
          toggled={filters.owned}
          onClick={toggleOwnedFilter}
        >
          Owned
        </Button>
        {filters.tags.map((tag) => (
          <Button
            key={tag}
            size="small"
            color="accent"
            className="cursor-pointer"
            onClick={() => {
              removeTagFilter(tag);
            }}
          >
            {tag}
            <Icon name="x" />
          </Button>
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
          <GamePickerItem
            gameId={gameId}
            owned={availableGames.includes(gameId)}
            isGameLeader={canSelectGame}
            key={gameId}
            selected={value === gameId}
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
});

const GamePickerItem = withGame<{
  gameId: string;
  owned: boolean;
  isGameLeader: boolean;
  selected: boolean;
}>(function GamePickerItem({
  gameId,
  owned,
  gameSuite,
  isGameLeader,
  selected,
}) {
  const openQuickBuy = useOpenQuickBuy();
  const updateGameMutation = sdkHooks.useUpdateGameSession();
  const voters = gameSuite.gameVotes[gameId];
  const votedForThisGame = voters?.includes(gameSuite.playerId);

  return (
    <Card
      className={clsx(
        'aspect-1 min-w-80px',
        selected && 'ring ring-inset ring-accent ring-6',
      )}
    >
      <Card.Image asChild>
        <GameIcon gameId={gameId} />
      </Card.Image>
      <GameDetailsDialog gameId={gameId}>
        <Card.Main nonInteractive={false}>
          <Card.Title className="text-sm md:text-md">
            <GameTitle gameId={gameId} />
          </Card.Title>
          {voters?.length > 0 && (
            <Card.Content unstyled>
              <AvatarList count={voters.length}>
                {voters.map((voter, i) => (
                  <AvatarList.ItemRoot index={i} key={voter}>
                    <PlayerAvatar playerId={voter} />
                  </AvatarList.ItemRoot>
                ))}
              </AvatarList>
            </Card.Content>
          )}
        </Card.Main>
      </GameDetailsDialog>
      <Card.Footer>
        <Card.Actions>
          {!owned && (
            <Button
              size="small"
              color="accent"
              onClick={() => openQuickBuy(gameId)}
            >
              <Icon name="cart" />
              Buy
            </Button>
          )}
          {owned && isGameLeader && (
            <Button
              size="small"
              color="primary"
              onClick={() =>
                updateGameMutation.mutateAsync({
                  id: gameSuite.gameSessionId,
                  gameId,
                })
              }
              disabled={selected}
            >
              <Icon name="check" />
              {selected ? 'Selected!' : 'Select'}
            </Button>
          )}
          {owned && !isGameLeader && (
            <Button
              size="small"
              color="primary"
              onClick={() => {
                if (votedForThisGame) {
                  gameSuite.removeVoteForGame(gameId);
                } else {
                  gameSuite.voteForGame(gameId);
                }
              }}
            >
              <Icon name={votedForThisGame ? 'x' : 'plus'} />
              {votedForThisGame ? 'Voted!' : 'Vote'}
            </Button>
          )}
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
});
