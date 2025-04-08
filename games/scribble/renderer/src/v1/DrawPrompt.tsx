import { Box, H2 } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { TaskCompletion } from '@long-game/game-scribble-definition/v1';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';

export interface DrawPromptProps {
  prompt: string;
  byPlayerId?: PrefixedId<'u'>;
  taskIndex: number;
}

export const DrawPrompt = hooks.withGame<DrawPromptProps>(function DrawPrompt({
  prompt,
  taskIndex,
  gameSuite,
  byPlayerId,
}) {
  const { playerId, currentTurn } = gameSuite;
  let completion = currentTurn?.taskCompletions[taskIndex];

  if (completion?.kind !== 'drawing') {
    completion = {
      kind: 'drawing',
      drawing: {
        strokes: [],
      },
    };
  }

  return (
    <Box d="col" gap items="center">
      <H2 className="text-3xl">Draw: {prompt}</H2>
      {byPlayerId && (
        <Box gap items="center">
          Prompt by <PlayerAvatar playerId={byPlayerId} />
          <PlayerName playerId={byPlayerId} />
        </Box>
      )}
      <Canvas
        drawing={completion.drawing}
        playerId={playerId}
        onChange={(drawing) => {
          if (!currentTurn) {
            const completions: TaskCompletion[] = new Array(2).fill(null);
            completions[taskIndex] = {
              kind: 'drawing',
              drawing,
            };
            gameSuite.prepareTurn({
              taskCompletions: completions,
            });
          } else {
            gameSuite.prepareTurn({
              ...currentTurn,
              taskCompletions: currentTurn.taskCompletions.map((c, i) => {
                if (i === taskIndex) {
                  return {
                    ...c,
                    kind: 'drawing',
                    drawing,
                  };
                }
                return c;
              }),
            });
          }
        }}
      />
    </Box>
  );
});
