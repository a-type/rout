import { Box, clsx, Text } from '@a-type/ui';
import {
  HelpSurface,
  PlayerAvatar,
  PlayerName,
  usePlayerThemed,
} from '@long-game/game-ui';
import { WordItem } from '../definition/index';
import { hooks } from './gameClient.js';
import cls from './PromptDisplay.module.css';
import { WordTile } from './WordTile.js';

export interface PromptDisplayProps {
  className?: string;
}

export const PromptDisplay = hooks.withGame<PromptDisplayProps>(
  function PromptDisplay({ gameSuite, className }) {
    const {
      finalState: { prompt },
    } = gameSuite;

    const theme = usePlayerThemed(prompt.playerId);

    if (prompt.words.length === 0) {
      // first round, no prompt yet
      return (
        <Box p surface color="primary">
          Start your story using your own words!
        </Box>
      );
    }

    return (
      <HelpSurface
        id="prompt-display"
        content={
          <div>
            You can only see the latest section of the story, written by one of
            the other players. It's your job to keep the story going using your
            own words!
          </div>
        }
        rulesId="continuing-the-story"
        title="Prompt"
        className="w-full"
      >
        <Box
          col
          gap
          surface
          color="primary"
          p
          full="width"
          style={theme.style}
          className={clsx(theme.className, className)}
        >
          <Text emphasis="ambient">
            <span className={cls.leadIn}>
              The latest part of the story, written by
            </span>
            <div className={cls.player}>
              <PlayerAvatar playerId={prompt.playerId} />
              <PlayerName playerId={prompt.playerId} />
            </div>
          </Text>
          <Box gap wrap items="center">
            {prompt.words.map((word: WordItem) => (
              <WordTile key={word.id} value={word} disabled />
            ))}
          </Box>
        </Box>
      </HelpSurface>
    );
  },
);
