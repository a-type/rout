import { AvatarList, Card, Icon } from '@a-type/ui';
import { withGame } from '@long-game/game-client';
import { PlayerAvatar } from '@long-game/game-ui';
import { GameList } from '../GameList.js';

export interface GamePickerProps {
  value: string;
  id?: string;
  className?: string;
  loading?: boolean;
  hotseat?: boolean;
  availableGames?: string[];
}

export const GamePicker = withGame<GamePickerProps>(function GamePicker({
  value,
  loading,
  className,
  gameSuite,
  ...rest
}) {
  return (
    <GameList {...rest}>
      {({ games }) =>
        games.map((game) => (
          <GamePickerItem
            gameId={game.id}
            owned={game.ownedByPlayer}
            key={game.id}
            selected={value === game.id}
          />
        ))
      }
    </GameList>
  );
});

export const GamePickerItem = withGame<{
  gameId: string;
  owned: boolean;
  selected: boolean;
}>(function GamePickerItem({ gameId, owned, gameSuite, selected }) {
  const voters = gameSuite.gameVotes[gameId];
  const votedForThisGame = voters?.includes(gameSuite.playerId);

  return (
    <GameList.Item
      gameId={gameId}
      canSelect={gameSuite.youAreLeader}
      owned={owned}
      selected={selected}
      onSelect={() => {
        gameSuite.voteForGame(gameId);
      }}
      voted={votedForThisGame}
      onVote={(voted) => {
        if (voted) {
          gameSuite.voteForGame(gameId);
        } else {
          gameSuite.removeVoteForGame(gameId);
        }
      }}
      canVote={!gameSuite.youAreLeader}
    >
      {voters?.length > 0 && (
        <Card.Content unstyled className="flex flex-row gap-xs items-center">
          <Icon name="suitHeart" className="fill-attention" size={20} />
          <AvatarList count={voters.length}>
            {voters.map((voter, i) => (
              <AvatarList.ItemRoot index={i} key={voter}>
                <PlayerAvatar playerId={voter} />
              </AvatarList.ItemRoot>
            ))}
          </AvatarList>
        </Card.Content>
      )}
    </GameList.Item>
  );
});
