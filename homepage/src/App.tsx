import { Box, Button, clsx, H2, P, withClassName, withProps } from '@a-type/ui';
import {
  ScrollTicker,
  TopographyBackground,
  Wordmark,
} from '@long-game/visual-components';
import cls from './App.module.css';
import { Footer } from './Footer.js';
import { GameIcons } from './GameIcons.js';

const App = () => {
  return (
    <Box col layout="center start" className={cls.root} gap="lg">
      <ScrollTicker className={cls.topTicker}>BETA</ScrollTicker>
      <Box
        gap
        p
        surface
        justify="between"
        items="center"
        className={cls.header}
      >
        <Wordmark className={cls.wordmark} />
        <Box gap>
          <Button
            emphasis="primary"
            color="accent"
            render={<a href="https://play.rout.games" />}
          >
            Play Now
          </Button>
        </Box>
      </Box>
      <TopographyBackground colorMode="dark" className={cls.background} />
      <GameIcons />
      <Container items="center" className={cls.heroContainer}>
        <H2 className={cls.heroTitle}>
          Play games
          <br />
          every day
          <br />
          with your friends
        </H2>
        <P className={cls.heroCopy}>
          No more scheduling. Every day is game night.
        </P>
        <P className={cls.heroCopy}>
          Rout games are social board games you play like a daily crossword.
        </P>
      </Container>
      <Container items="center">
        <Button
          emphasis="primary"
          className={clsx('@mode-inverted', cls.ctaButton)}
          render={<a href="https://play.rout.games" />}
        >
          Play Now
        </Button>
      </Container>
      <Footer />
      <ScrollTicker className={cls.bottomTicker}>NEVER LOSE TOUCH</ScrollTicker>
    </Box>
  );
};

const Container = withClassName(
  withProps(Box, {
    p: 'xl',
    col: true,
    gap: 'xl',
  }),
  cls.container,
);

export default App;
