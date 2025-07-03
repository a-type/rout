import { Box } from '@a-type/ui';
import { WordItem } from '@long-game/game-exquisite-fridge-definition/v1';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { hooks } from './gameClient';
import { WordTile } from './WordTile';

export interface PromptDisplayProps {
  className?: string;
}

export const PromptDisplay = hooks.withGame<PromptDisplayProps>(
  function PromptDisplay({ gameSuite, className }) {
    const {
      finalState: { prompt },
    } = gameSuite;

    if (prompt.words.length === 0) {
      // first round, no prompt yet
      return (
        <Box p surface="primary">
          Start your story using your own words!
        </Box>
      );
    }

    return (
      <Box col gap="lg" surface="primary" p className={className}>
        <div>
          <span className="leading-loose">
            The latest part of the story, written by
          </span>
          <div className="inline-flex items-center gap-sm bg-primary-light py-xs px-sm rounded-full relative top-sm mx-sm">
            <PlayerAvatar playerId={prompt.playerId} />
            <PlayerName playerId={prompt.playerId} />
          </div>
        </div>
        <Box gap wrap>
          {prompt.words.map((word: WordItem) => (
            <WordTile key={word.id} value={word} disabled />
          ))}
        </Box>
      </Box>
    );
  },
);
