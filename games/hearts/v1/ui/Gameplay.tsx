import { Box } from '@a-type/ui';
import { TurnError } from '@long-game/game-ui';
import { useEffect } from 'react';
import { CurrentTrick } from './CurrentTrick.js';
import { hooks } from './gameClient.js';
import cls from './Gameplay.module.css';
import { Hand } from './Hand.js';
import { PassZone } from './PassZone.js';
import { PlayerScores } from './PlayerScores.js';

export interface GameplayProps {}

export const Gameplay = hooks.withGame<GameplayProps>(function Gameplay({
  gameSuite,
}) {
  const isDraftRound = gameSuite.finalState.task === 'draft';

  // when canceling submit in this game, we reset the turn.
  useEffect(
    () =>
      gameSuite.subscribe('turnSubmitCancelled', () => {
        gameSuite.prepareTurn(null);
      }),
    [gameSuite],
  );

  return (
    <Box data-gameplay full="width" grow col gap p className={cls.root}>
      <PlayerScores className={cls.scores} />
      <TurnError surface color="attention" p showReset />
      <Box grow overflow="clip" col gap="sm" layout="center center">
        <Box
          className={cls.main}
          p="xs"
          col
          full="width"
          justify="stretch"
          items="stretch"
        >
          {isDraftRound && gameSuite.isViewingCurrentRound ? (
            <PassZone />
          ) : (
            <CurrentTrick />
          )}
        </Box>
      </Box>
      <Hand
        className={cls.hand}
        disabled={
          gameSuite.finalState.task === null || !gameSuite.isViewingCurrentRound
        }
      />
    </Box>
  );
});
