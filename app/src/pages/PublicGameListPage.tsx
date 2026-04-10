import { Wordmark } from '@/components/brand/Wordmark';
import { GameIcon } from '@/components/games/GameIcon';
import { sdkHooks } from '@/services/publicSdk';
import { Box, H1, H2, P, PageContent, PageRoot } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

const PublicGameListPage = () => {
  const { data: games } = sdkHooks.useGetGames({ prerelease: false });

  return (
    <PageRoot className="h-auto">
      <PageContent>
        <Box gap p justify="between">
          <Link to="https://rout.games">
            <Wordmark />
          </Link>
          <H1>Games</H1>
        </Box>

        <Box gap col>
          {Object.values(games).map((game) => (
            <Box
              key={game.id}
              surface
              gap
              p
              className="hover:shadow-md transition-shadow cursor-pointer"
              render={<Link to={`/games/${game.id}`} />}
            >
              <GameIcon
                gameId={game.id}
                className="w-32 h-32 border border-default rounded-md"
              />
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
