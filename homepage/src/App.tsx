import { Box, Button, H2, P, withClassName, withProps } from '@a-type/ui';
import {
  ScrollTicker,
  TopographyBackground,
  Wordmark,
} from '@long-game/visual-components';
import { Footer } from './Footer';
import { GameIcons } from './GameIcons';

const App = () => {
  return (
    <Box d="col" layout="center start" className="bg-wash" gap="lg">
      <ScrollTicker className="bg-white color-black w-full relative z-1 p-sm font-bold">
        BETA
      </ScrollTicker>
      <Box
        gap
        p
        surface="default"
        justify="between"
        items="center"
        className="w-full max-w-600px z-1 px-lg"
      >
        <Wordmark className="text-2xl" />
        <Box gap>
          <Button asChild color="primary">
            <a href="https://play.rout.games">Play Now</a>
          </Button>
        </Box>
      </Box>
      <TopographyBackground colorMode="dark" className="fixed" />
      <GameIcons />
      <Container items="center" className="text-center py-xl">
        <H2 className="text-6xl font-medium font-heading">
          Play games
          <br />
          every day
          <br />
          with your friends
        </H2>
        <P className="text-lg color-gray-dark">
          No more scheduling. Every day is game night.
        </P>
        <P className="text-lg color-gray-dark">
          Rout games are social party games you play like a daily crossword.
        </P>
      </Container>
      <Container items="center">
        <Button asChild color="primary" className="text-xl px-xl p-md">
          <a href="https://play.rout.games">Play Now</a>
        </Button>
      </Container>
      <Footer />
      <ScrollTicker className="bg-accent color-accent-ink w-full relative z-1 p-sm font-bold">
        NEVER LOSE TOUCH
      </ScrollTicker>
    </Box>
  );
};

const Container = withClassName(
  withProps(Box, {
    p: 'xl',
    d: 'col',
    gap: 'xl',
  }),
  'max-w-800px w-full flex-shrink-0',
);

export default App;
