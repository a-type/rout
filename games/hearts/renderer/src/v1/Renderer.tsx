import { Box } from '@a-type/ui';
import { PlayerAvatar, PlayerName } from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { Gameplay } from './Gameplay.js';
import { PlayerScores } from './PlayerScores.js';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export const Renderer = hooks.withGame(function Client({ gameSuite }) {
  if (
    gameSuite.gameStatus.status === 'complete' &&
    gameSuite.viewingRoundIndex === gameSuite.latestRoundIndex
  ) {
    return <GameRecap />;
  }

  return <Gameplay />;
});
export default Renderer;

const GameRecap = hooks.withGame(function GameRecap({ gameSuite }) {
  const winner =
    gameSuite.gameStatus.status === 'complete'
      ? gameSuite.gameStatus.winnerIds[0]
      : null;
  if (!winner) throw new Error('Game recap requires a winner');

  return (
    <Box col gap>
      <Box gap="sm" items="center" p>
        <PlayerAvatar playerId={winner} />
        <PlayerName disableYou playerId={winner} /> wins!
      </Box>
      <PlayerScores />
    </Box>
  );
});
