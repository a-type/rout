import { Box, Button, H2, P, withClassName, withProps } from '@a-type/ui';
import { TopographyBackground, Wordmark } from '@long-game/visual-components';
import { GameIcons } from './GameIcons';
import { Scene } from './Scene';

const App = () => {
  return (
    <Box d="col" layout="center start" className="bg-wash" gap="lg">
      <Box
        gap
        p
        surface="default"
        justify="between"
        items="center"
        className="w-full max-w-600px z-1 px-lg"
      >
        <Wordmark className="text-xl" />
        <Box gap>
          <Button asChild color="ghost">
            <a href="https://play.rout.games">Learn More</a>
          </Button>
          <Button asChild color="primary">
            <a href="https://play.rout.games">Play Now</a>
          </Button>
        </Box>
      </Box>
      <TopographyBackground colorMode="dark" />
      <Container items="center" className="text-center py-16">
        <H2 className="text-4xl font-normal">
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
      <GameIcons />

      <Box
        full="width"
        layout="center center"
        className="border-t-solid border-t-6px border-t-black w-full h-full max-h-800px"
      >
        <Scene />
      </Box>
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
