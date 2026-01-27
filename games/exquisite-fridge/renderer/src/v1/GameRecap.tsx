import { Box, clsx, H2, P, Tabs } from '@a-type/ui';
import { StoryStep } from '@long-game/game-exquisite-fridge-definition/v1';
import {
  PlayerAvatar,
  PlayerName,
  TopographyBackground,
  usePlayerThemed,
} from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { WordTile } from './WordTile.js';

export interface GameRecapProps {}

export const GameRecap = hooks.withGame<GameRecapProps>(function GameRecap({
  gameSuite,
}) {
  const globalState = gameSuite.postgameGlobalState;
  if (!globalState) {
    return <Box>Error!</Box>;
  }

  return (
    <Box col full="width" grow p>
      <TopographyBackground />
      <Box col surface gap p="md" className="max-w-500px w-full mx-auto">
        <H2>That's a wrap!</H2>
        <P>Time to read our stories!</P>
        <Tabs defaultValue="0" className="w-full">
          <Tabs.List>
            {globalState.sequences.map((_, index) => (
              <Tabs.Trigger key={index} value={index.toString()}>
                Story {index + 1}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {globalState.sequences.map((sequence, index) => (
            <Tabs.Content key={index} value={index.toString()}>
              <Box col gap items="start">
                {sequence.map((section, si) => (
                  <RecapSequenceSection key={si.toString()} section={section} />
                ))}
              </Box>
            </Tabs.Content>
          ))}
        </Tabs>
      </Box>
    </Box>
  );
});

function RecapSequenceSection({ section }: { section: StoryStep }) {
  const theme = usePlayerThemed(section.playerId);
  return (
    <Box
      surface
      color="primary"
      p
      col
      gap
      style={theme.style}
      className={clsx(theme.className, 'pb-[40px]')}
    >
      <Box gap wrap>
        {section.words.map((word, index) => (
          <WordTile disabled value={word} key={index} />
        ))}
      </Box>
      <Box
        gap
        layout="center center"
        surface
        color="primary"
        p="sm"
        className="text-xs color-primary-dark absolute right-0 bottom-0"
      >
        <PlayerAvatar playerId={section.playerId} size={20} />
        <PlayerName playerId={section.playerId} />
      </Box>
    </Box>
  );
}
