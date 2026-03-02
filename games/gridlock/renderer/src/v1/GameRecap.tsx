import { GameMember } from '@long-game/game-definition';
import {
  boardSize,
  getDistinctPaths,
  pathsToLookup,
  scoreBoard,
  toCellKey,
} from '@long-game/game-gridlock-definition/v1';
import { PlayerAvatar, PlayerName, PlayerThemed } from '@long-game/game-ui';
import { Fragment } from 'react/jsx-runtime';
import { BoardGrid, BoardGridCell } from './board/BoardGrid.js';
import { PathAnnotations } from './board/PathAnnotations.js';
import { TileRenderer } from './board/TileRenderer.js';
import { hooks } from './gameClient.js';

export interface GameRecapProps {}

export const GameRecap = hooks.withGame<GameRecapProps>(function GameRecap({
  gameSuite,
}) {
  return (
    <div className="w-full flex flex-col items-center min-h-0">
      <Scoreboard />
      <div className="p-md w-full grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-md">
        {gameSuite.members.map((member) => (
          <RecapPlayerBoard key={member.id} player={member} />
        ))}
      </div>
    </div>
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
    <div className="w-full flex flex-col gap-xs w-full items-center text-xl">
      <div>👑 Winner{gameSuite.winners.length === 1 ? '' : 's'} </div>
      <div className="flex flex-row items-center gap-md">
        {scores.map(({ player, score }) => (
          <div
            key={player.id}
            className="flex flex-col items-center gap-xs font-bold"
          >
            <div className="flex flex-row items-center gap-xs">
              <PlayerAvatar playerId={player.id} />
              <PlayerName playerId={player.id} />
            </div>
            <span className="font-normal">Score: {score}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const RecapPlayerBoard = hooks.withGame<{ player: GameMember }>(
  function RecapPlayerBoard({ player, gameSuite }) {
    const playerBoard = gameSuite.postgameGlobalState?.playerBoards[player.id];
    if (!playerBoard) return null;
    const paths = getDistinctPaths(playerBoard);
    const pathLookup = pathsToLookup(paths);
    return (
      <PlayerThemed
        playerId={player.id}
        className="bg-white border-default rd-md p-md w-full"
      >
        <div className="flex items-center gap-xs mb-sm">
          <PlayerAvatar interactive playerId={player.id} size="40px" />
          <PlayerName playerId={player.id} />
          <span className="ml-auto font-bold">
            Score: {scoreBoard(playerBoard)}
          </span>
        </div>
        <BoardGrid className="w-full">
          {new Array(boardSize).fill(0).map((_, y) => (
            <Fragment key={y}>
              {new Array(boardSize).fill(0).map((_, x) => {
                const key = toCellKey(x, y);
                const cell = playerBoard[key];
                const path = pathLookup[key];
                if (!cell) return null;
                return (
                  <BoardGridCell
                    x={x}
                    y={y}
                    key={key}
                    className="rd-sm bg-white"
                    anchorNamespace={player.id}
                  >
                    <TileRenderer
                      tile={cell.tile}
                      pathIsBroken={!!path?.breaks.length}
                      pathIsComplete={path?.isComplete}
                    />
                  </BoardGridCell>
                );
              })}
            </Fragment>
          ))}
          <PathAnnotations paths={paths} anchorNamespace={player.id} />
        </BoardGrid>
      </PlayerThemed>
    );
  },
);
