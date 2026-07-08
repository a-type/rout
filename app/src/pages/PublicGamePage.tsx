import { GameIcon } from '@/components/games/GameIcon';
import { GameManual } from '@/components/games/GameManual';
import { GameScreenshotGallery } from '@/components/games/GameScreenshotGallery';
import { StartHotseat } from '@/components/games/StartHotseat';
import { StartOnline } from '@/components/games/StartOnline';
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
import { ScrollTicker, Wordmark } from '@long-game/game-ui';
import { Link, useParams } from '@verdant-web/react-router';
import cls from './PublicGamePage.module.css';

const PublicGamePage = () => {
  const { gameId } = useParams();
  const game = useGame(gameId);
  const { data: me } = sdkHooks.useGetMe();

  return (
    <>
      <PageRoot className="h-auto">
        <PageContent>
          <Box gap p>
            <Link to="https://rout.games">
              <Wordmark className="text-lg" />
            </Link>
          </Box>

          <Box gap items="end">
            <GameIcon gameId={gameId} size={128} border />
            <Box col gap="sm" grow>
              <H1 className="font-fancy">{game.title}</H1>
              <P>{game.description}</P>
            </Box>
          </Box>
          {!!game.screenshots?.length && (
            <GameScreenshotGallery
              gameId={gameId}
              style={{
                width: '100%',
                maxHeight: '60vh',
                marginBottom: 80,
              }}
            />
          )}
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

          <PageNowPlaying className={cls.actions}>
            <StartHotseat gameId={gameId} emphasis="default">
              <Icon name="phone" /> Try Hotseat
            </StartHotseat>
            {me ? (
              <StartOnline gameId={gameId} emphasis="primary">
                <Icon name="gamePiece" /> Play with Friends
              </StartOnline>
            ) : (
              <Button
                emphasis="primary"
                render={<Link to={`/login?returnTo=/games/${gameId}`} />}
              >
                Play with Friends
                <Icon name="arrowRight" />
              </Button>
            )}
          </PageNowPlaying>
        </PageContent>
      </PageRoot>
      <ScrollTicker className={cls.ticker}>Never lose touch</ScrollTicker>
    </>
  );
};

export default PublicGamePage;
