import { CreateHotseat } from '@/components/games/CreateHotseat';
import { GameIcon } from '@/components/games/GameIcon';
import { GameManual } from '@/components/games/GameManual';
import { GameScreenshotGallery } from '@/components/games/GameScreenshotGallery';
import { useGame } from '@/hooks/useGame';
import {
  Box,
  Button,
  ErrorBoundary,
  H1,
  H2,
  Icon,
  P,
  PageContent,
  PageNowPlaying,
  PageRoot,
} from '@a-type/ui';
import { TopographyBackground } from '@long-game/game-ui';
import { Link, useParams } from '@verdant-web/react-router';

const PublicGamePage = () => {
  const { gameId } = useParams();
  const game = useGame(gameId);

  return (
    <PageRoot className="h-auto">
      <TopographyBackground className="fixed" />
      <PageContent className="pb-25vh">
        {!!game.screenshots?.length && (
          <GameScreenshotGallery
            gameId={gameId}
            className="w-full max-h-60vh"
          />
        )}
        <Box gap>
          <GameIcon
            gameId={gameId}
            className="w-32 h-32 border border-default rounded-md"
          />
          <Box col gap="sm" grow>
            <H1 className="font-fancy">{game.title}</H1>
            <P>{game.description}</P>
          </Box>
        </Box>
        <H2>How to play</H2>
        <ErrorBoundary fallback={<P>Failed to load game manual.</P>}>
          <GameManual gameId={gameId} />
        </ErrorBoundary>

        <PageNowPlaying
          unstyled
          className="flex flex-row items-center justify-center"
        >
          <CreateHotseat gameId={gameId} color="default" className="shadow-md">
            <Icon name="phone" /> Try Hotseat
          </CreateHotseat>
          <Button className="shadow-md" color="primary" asChild>
            <Link to={`/login?returnTo=/library?quickBuy=${gameId}`}>
              <Icon name="gamePiece" />
              Play with Friends
            </Link>
          </Button>
        </PageNowPlaying>
      </PageContent>
    </PageRoot>
  );
};

export default PublicGamePage;
