import { Wordmark } from '@/components/brand/Wordmark';
import { CreateGame } from '@/components/games/CreateGame';
import { CreateHotseat } from '@/components/games/CreateHotseat';
import { GameIcon } from '@/components/games/GameIcon';
import { GameManual } from '@/components/games/GameManual';
import { GameScreenshotGallery } from '@/components/games/GameScreenshotGallery';
import { useGame } from '@/hooks/useGame';
import { sdkHooks } from '@/services/publicSdk';
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
import { ScrollTicker, TopographyBackground } from '@long-game/game-ui';
import { Link, useParams } from '@verdant-web/react-router';

const PublicGamePage = () => {
  const { gameId } = useParams();
  const game = useGame(gameId);
  const { data: me } = sdkHooks.useGetMe();

  return (
    <>
      <PageRoot className="h-auto">
        <TopographyBackground className="fixed" />
        <PageContent>
          <Box gap p>
            <Link to="https://rout.games">
              <Wordmark className="text-lg" />
            </Link>
          </Box>
          {!!game.screenshots?.length && (
            <GameScreenshotGallery
              gameId={gameId}
              className="w-full max-h-60vh mb-xl"
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

          <Box justify="between" full="width" className="text-xs mt-25vh">
            <Box col gap>
              <div className="font-fancy text-bold">Rout!</div>
              <div>© 2025 Grant Forrest</div>
            </Box>
            <Box col gap>
              <a href="https://rout.games/privacy">Privacy Policy</a>
              <a href="https://rout.games/tos">Terms of Service</a>
            </Box>
          </Box>

          <PageNowPlaying
            unstyled
            className="flex flex-row items-center justify-center"
          >
            <CreateHotseat
              gameId={gameId}
              color="default"
              className="shadow-md"
            >
              <Icon name="phone" /> Try Hotseat
            </CreateHotseat>
            {me ? (
              <CreateGame gameId={gameId} color="primary" className="shadow-md">
                <Icon name="gamePiece" /> Play with Friends
              </CreateGame>
            ) : (
              <Button className="shadow-md" color="primary" asChild>
                <Link to={`/login?returnTo=/games/${gameId}`}>
                  Play with Friends
                  <Icon name="arrowRight" />
                </Link>
              </Button>
            )}
          </PageNowPlaying>
        </PageContent>
      </PageRoot>
      <ScrollTicker className="bg-accent color-accent-ink w-full relative z-1 p-sm font-bold uppercase">
        Never lose touch
      </ScrollTicker>
    </>
  );
};

export default PublicGamePage;
