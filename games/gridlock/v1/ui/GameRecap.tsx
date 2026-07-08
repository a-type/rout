import { Box, Button, Dialog, Text } from '@a-type/ui';
import { GameMember } from '@long-game/game-definition';
import { PlayerAvatar, PlayerName, PlayerThemed } from '@long-game/game-ui';
import { scoreBoard } from '../definition/index';
import { BoardRenderer } from './board/BoardRenderer.js';
import { hooks } from './gameClient.js';

export interface GameRecapProps {}

export const GameRecap = hooks.withGame<GameRecapProps>(function GameRecap({
  gameSuite,
}) {
  return (
    <Box full="width" col items="center" style={{ minHeight: 0 }}>
      <Scoreboard />
      <div className={cls.grid}>
        {gameSuite.members.map((member) => (
          <RecapPlayerBoard key={member.id} player={member} />
        ))}
      </div>
    </Box>
  );
});

const Scoreboard = hooks.withGame(function Scoreboard({ gameSuite }) {
  const scores = gameSuite.winners
    .map((member) => {
      const board = gameSuite.postgameGlobalState?.playerBoards[member.id];
      if (!board) return { player: member, score: 0 };
      return { player: member, score: scoreBoard(board) };
    })
    .sort((a, b) => b.score - a.score);
  return (
    <Box full="width" col gap="xs" items="center">
      <Text emphasis="primary">
        👑 Winner{gameSuite.winners.length === 1 ? '' : 's'}{' '}
      </Text>
      <Box items="center" gap>
        {scores.map(({ player, score }) => (
          <Box key={player.id} col items="center" gap="xs">
            <PlayerAvatar playerId={player.id} />
            <Text bold>
              <PlayerName playerId={player.id} />
            </Text>
            <Text>Score: {score}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

const RecapPlayerBoard = hooks.withGame<{ player: GameMember }>(
  function RecapPlayerBoard({ player, gameSuite }) {
    const playerBoard = gameSuite.postgameGlobalState?.playerBoards[player.id];
    if (!playerBoard) return null;
    return (
      <Dialog>
        <Box
          surface
          round
          p
          full="width"
          col
          render={<PlayerThemed playerId={player.id} />}
        >
          <Box items="center" gap="xs">
            <PlayerAvatar interactive playerId={player.id} size="40px" />
            <PlayerName playerId={player.id} />
            <Text bold style={{ marginLeft: 'auto' }}>
              Score: {scoreBoard(playerBoard)}
            </Text>
          </Box>
          <Dialog.Trigger render={<Button emphasis="ghost" size="wrapper" />}>
            <BoardRenderer
              board={playerBoard}
              playerId={player.id}
              readonly
              className="w-full"
            />
          </Dialog.Trigger>
        </Box>
        <Dialog.Content disableSheet width="lg">
          <BoardRenderer
            board={playerBoard}
            playerId={player.id}
            readonly
            className="w-full"
          />
        </Dialog.Content>
      </Dialog>
    );
  },
);
