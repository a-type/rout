import { Box, H2 } from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { Canvas } from './drawing/Canvas';
import { hooks } from './gameClient';
import { ProceedOrSubmit } from './ProceedOrSubmit';

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
          gameSuite.prepareTurn((curr) => {
            if (!curr) {
              curr = {
                taskCompletions: [],
              };
            }
            curr.taskCompletions[taskIndex] = {
              kind: 'drawing',
              drawing,
            };
            return curr;
          });
        }}
      />
      <ProceedOrSubmit taskIndex={taskIndex} />
    </Box>
  );
});
