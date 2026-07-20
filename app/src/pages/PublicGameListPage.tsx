import { GameIcon } from '@/components/games/GameIcon';
import { sdkHooks } from '@/services/publicSdk';
import { Box, H1, H2, P, PageContent, PageRoot } from '@a-type/ui';
import { Wordmark } from '@long-game/game-ui';
import { Link } from '@tanstack/react-router';
import cls from './PublicGameListPage.module.css';

const PublicGameListPage = () => {
  const { data: games } = sdkHooks.useGetGames({ prerelease: false });

  return (
    <PageRoot className="h-auto">
      <PageContent>
        <Box gap p justify="between">
          <a href="https://rout.games">
            <Wordmark />
          </a>
          <H1>Games</H1>
        </Box>

        <Box gap col>
          {Object.values(games).map((game) => (
            <Box
              key={game.id}
              surface
              gap
              p
              className={cls.gameCard}
              render={<Link to="/games/$gameId" params={{ gameId: game.id }} />}
            >
              <GameIcon gameId={game.id} className={cls.gameIcon} />
              <Box col gap="sm" grow>
                <H2>{game.title}</H2>
                <P>{game.description}</P>
              </Box>
            </Box>
          ))}
        </Box>
      </PageContent>
    </PageRoot>
  );
};

export default PublicGameListPage;
