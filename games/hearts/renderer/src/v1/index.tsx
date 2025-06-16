import { Box } from '@a-type/ui';
import {
  DefaultChatMessage,
  PlayerAvatar,
  PlayerName,
} from '@long-game/game-ui';
import { hooks } from './gameClient.js';
import { Gameplay } from './Gameplay.js';
import { PlayerScores } from './PlayerScores.js';

// note: withGame can take a generic <Props> which adds more accepted
// props to your wrapped component. withGame always provides gameSuite,
// a fully reactive SDK which lets you read game state, members, chat,
// etc, prepare and submit turns, as well as view historical states

export const Client = hooks.withGame(function Client({ gameSuite }) {
  if (gameSuite.gameStatus.status === 'complete') {
    return <GameRecap />;
  }

  return <Gameplay />;
});

export const ChatMessage = DefaultChatMessage;

const GameRecap = hooks.withGame(function GameRecap({ gameSuite }) {
  const winner =
    gameSuite.gameStatus.status === 'complete'
      ? gameSuite.gameStatus.winnerIds[0]
      : null;
  if (!winner) throw new Error('Game recap requires a winner');

  return (
    <Box col gap>
      <Box gap="sm">
        <PlayerAvatar playerId={winner} />
        <PlayerName playerId={winner} /> wins!
      </Box>
      <PlayerScores />
    </Box>
  );
});
