import { Box, clsx } from '@a-type/ui';
import { WordItem } from '@long-game/game-exquisite-fridge-definition/v1';
import {
  HelpSurface,
  PlayerAvatar,
  PlayerName,
  usePlayerThemed,
} from '@long-game/game-ui';
import { hooks } from './gameClient.js';
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
      >
        <Box
          col
          gap
          surface
          color="primary"
          p
          style={theme.style}
          className={clsx(theme.className, className)}
        >
          <div className="text-xs">
            <span className="[line-height:32px] [vertical-align:top]">
              The latest part of the story, written by
            </span>
            <div className="inline-flex items-center gap-sm bg-primary-light py-xs px-sm rounded-full">
              <PlayerAvatar playerId={prompt.playerId} />
              <PlayerName playerId={prompt.playerId} />
            </div>
          </div>
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
