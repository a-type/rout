import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  Card,
  Chip,
  clsx,
  Collapsible,
  HorizontalList,
  Icon,
  Switch,
} from '@a-type/ui';
import { GameListItemDetails } from '@long-game/game-client';
import { ReactNode, useState } from 'react';
import { GameDetailsDialog } from '../library/GameDetailsDialog';
import { useOpenQuickBuy } from '../store/QuickBuyPopup';
import { GameIcon } from './GameIcon';
import cls from './GameList.module.css';
import { GameTitle } from './GameTitle';

interface GameListFilters {
  tags: string[];
  available: boolean;
}

export interface GameListProps {
  /**
   * Custom list of games to show as available. Useful for overriding
   * in live games with the superset of player-owned games.
   *
   * Otherwise, shows all games for hotseat, or player-owned games.
   */
  availableGames?: string[];
  hotseat?: boolean;
  className?: string;
  children: (data: {
    games: (GameListItemDetails & { ownedByPlayer: boolean })[];
    filters: GameListFilters;
  }) => ReactNode;
}

export function GameListRoot({
  hotseat,
  availableGames,
  className,
  children,
  ...rest
}: GameListProps) {
  const { data: owned } = sdkHooks.useGetOwnedGames();
  const { data: games } = sdkHooks.useGetGames({ prerelease: true });
  const allTags = new Set<string>();
  for (const game of Object.values(games)) {
    for (const tag of game.tags) {
      allTags.add(tag);
    }
  }

  const [filters, setFilters] = useState({
    tags: [] as string[],
    available: hotseat ? false : true,
  });

  const removeTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };
  const addTagFilter = (tag: string | null) => {
    if (!tag) return;
    setFilters((prev) => ({
      ...prev,
      tags: [...prev.tags, tag],
    }));
  };
  const toggleAvailableFilter = () => {
    setFilters((prev) => ({
      ...prev,
      available: !prev.available,
    }));
  };

  const { data: me } = sdkHooks.useGetMe();
  const isAdmin = me?.isProductAdmin;

  const filteredGamesIncludingUnowned = Object.values(games)
    .filter((game) => isAdmin || !game.prerelease)
    .filter((game) => {
      if (filters.tags.length > 0) {
        return filters.tags.some((tag) => game.tags.includes(tag));
      }
      return true;
    });
  const filteredGames = filteredGamesIncludingUnowned
    .filter((game) => {
      if (!availableGames) {
        return true;
      }
      if (filters.available && !availableGames?.includes(game.id)) {
        return false;
      }
      return true;
    })
    .map((game) => ({
      ...game,
      ownedByPlayer: owned ? owned.includes(game.id) : true,
    }));

  return (
    <Box
      col
      gap
      items="stretch"
      full="width"
      className={clsx(className)}
      {...rest}
    >
      <Box>
        <Collapsible className={cls.collapsible}>
          <div className={cls.triggerWrap}>
            <Collapsible.Trigger
              render={<Button size="small" emphasis="ghost" />}
            >
              <Icon name="filter" />
              Filters
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content className={cls.content}>
            <Box col gap="sm" p="sm" container full items="start">
              <label className={cls.filterLabel}>
                <Switch
                  checked={filters.available}
                  onCheckedChange={toggleAvailableFilter}
                />
                Only show games owned by players
              </label>
              <HorizontalList>
                {Array.from(allTags).map((tag) => (
                  <Button
                    size="small"
                    toggled={filters.tags.includes(tag)}
                    key={tag}
                    onClick={() => {
                      if (filters.tags.includes(tag)) {
                        removeTagFilter(tag);
                      } else {
                        addTagFilter(tag);
                      }
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </HorizontalList>
            </Box>
          </Collapsible.Content>
        </Collapsible>
      </Box>
      <Box className={cls.gameGrid}>
        {children({ games: filteredGames, filters })}
      </Box>
      {!filteredGames.length && (
        <Box full="width" layout="center center" className={cls.emptyState}>
          {filters.available ? (
            <Box col items="center" gap>
              No games owned by a player match these filters.
              {filteredGamesIncludingUnowned.length ? (
                <Button
                  size="small"
                  emphasis="ghost"
                  onClick={toggleAvailableFilter}
                >
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

export function GameListItem({
  gameId,
  owned,
  canSelect,
  selected,
  className,
  children,
  onSelect,
  canVote,
  onVote,
  voted,
}: {
  gameId: string;
  owned: boolean;
  canSelect: boolean;
  selected: boolean;
  className?: string;
  children?: ReactNode;
  onSelect?: () => void;
  canVote?: boolean;
  onVote?: (voted: boolean) => void;
  voted?: boolean;
}) {
  const openQuickBuy = useOpenQuickBuy();

  return (
    <Card className={clsx(cls.item, selected && cls.selected, className)}>
      <Card.Image render={<GameIcon gameId={gameId} />} />
      <GameDetailsDialog gameId={gameId}>
        <Card.Main nonInteractive={false}>
          <Card.Title className={cls.title}>
            <GameTitle gameId={gameId} />
          </Card.Title>
          {selected && (
            <Card.Content unstyled>
              <Chip color="success">Selected</Chip>
            </Card.Content>
          )}
          {children}
        </Card.Main>
      </GameDetailsDialog>
      <Card.Footer>
        {!owned && (
          <Button
            className={cls.actionButton}
            color="accent"
            emphasis="primary"
            onClick={() => openQuickBuy(gameId)}
          >
            <Icon name="cart" />
            Buy
          </Button>
        )}
        {owned && canSelect && (
          <Button
            className={cls.actionButton}
            emphasis="primary"
            onClick={onSelect}
            disabled={selected}
          >
            <Icon name="check" />
            Select
          </Button>
        )}
        {!canSelect && canVote && (
          <Button
            className={cls.actionButton}
            emphasis="primary"
            onClick={() => {
              if (voted) {
                onVote?.(false);
              } else {
                onVote?.(true);
              }
            }}
          >
            <Icon name={voted ? 'x' : 'plus'} />
            {voted ? 'Voted!' : 'Vote'}
          </Button>
        )}
      </Card.Footer>
    </Card>
  );
}

export const GameList = Object.assign(GameListRoot, {
  Item: GameListItem,
});
