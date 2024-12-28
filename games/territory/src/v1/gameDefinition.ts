import { GameRound } from '@long-game/common';
import { GameDefinition, Turn, roundFormat } from '@long-game/game-definition';
import { lazy } from 'react';
import { getContiguousTerritories, type Territory } from './utils.js';

/**
 * In this game, players simultaneously place tiles on a grid which represent
 * armies. Contiguous tiles of the same player form territories and share power.
 *
 * When two or more players simultaneously place tiles on the same cell, a battle
 * occurs. Any contiguous territories of a player involved in the battle will
 * add to their power. Power is subtracted from all involved territories until
 * one (or no) player remains.
 *
 * The remaining player takes the cell and gains 1 power to that cell and any
 * contiguous territories as usual. Any depleted territories are removed.
 *
 * The game ends when a player reaches a
 * certain total power level in one territory, depending on the total
 * number of players.
 */

export type GridCell = {
  playerId: string | null;
  power: number;
};

export type Coordinate = {
  x: number;
  y: number;
};

export type GlobalState = {
  // 2D grid of cells - first index is y, second is x
  grid: GridCell[][];
};

// no secret information
export type PlayerState = GlobalState;

export type TurnData = {
  placements: Coordinate[];
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    // only allow 1 placement for now
    if (turn.data.placements.length !== 1) {
      return 'Must place exactly 1 tile';
    }
    // only allow placement in empty cell
    const [placement] = turn.data.placements;
    if (playerState.grid[placement.y][placement.x].playerId) {
      return 'Cell already occupied';
    }
  },

  Client: lazy(() => import('./Client.js')),
  GameRecap: lazy(() => import('./GameRecap.js')),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // apply the placement to the grid
    const grid = playerState.grid.map((row) => [...row]);
    const [placement] = prospectiveTurn.data.placements;
    grid[placement.y][placement.x] = {
      playerId: prospectiveTurn.playerId,
      power: 1,
    };
    return {
      grid,
    };
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    const gridSize = 8 + members.length * 2;
    const grid = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => ({
        playerId: null,
        power: 0,
      })),
    );
    return {
      grid,
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    return globalState;
  },

  getState: ({ initialState, random, rounds }) => {
    return rounds.reduce(applyRoundToGlobalState, {
      ...initialState,
    });
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full turn data into what players can see
    // (i.e. what should you know about other players' turns?)
    return turn;
  },

  getStatus: ({ globalState, rounds, members }) => {
    const playerPowers = countTotalPowerPerPlayer(globalState);
    const requiredPower = getRequiredPowerToWin(members.length);
    const winners: string[] = [];
    for (const playerId in playerPowers) {
      if (playerPowers[playerId] >= requiredPower) {
        winners.push(playerId);
      }
    }
    if (winners.length > 0) {
      return {
        status: 'completed',
        winnerIds: winners,
      };
    }
    return {
      status: 'active',
    };
  },
};

// helper methods
const applyRoundToGlobalState = (
  globalState: GlobalState,
  round: GameRound<Turn<TurnData>>,
): GlobalState => {
  // find identical placements and run battles
  const collisionMap: Record<string, string[]> = {};
  for (const turn of round.turns) {
    const [placement] = turn.data.placements;
    const key = `${placement.x},${placement.y}`;
    collisionMap[key] = collisionMap[key] || [];
    // TODO: validate this in framework
    if (!turn.playerId) {
      throw new Error('Turn missing player ID');
    }
    collisionMap[key].push(turn.playerId);
  }

  const battles = Object.entries(collisionMap).filter(
    ([coordKey, players]) => players.length > 1,
  );
  for (const [coordKey, battleGroup] of battles) {
    const coordinate = coordKey.split(',').map((n) => parseInt(n, 10));
    const involvedTerritories = getContiguousTerritories(
      globalState.grid,
      coordinate[0],
      coordinate[1],
    );
    const playerTerritories = Object.fromEntries(
      battleGroup.map<[string, Territory[]]>((playerId) => {
        return [
          playerId,
          // sort territories most powerful first
          [
            // everyone gets to count the battlefield
            {
              playerId,
              cells: [{ x: coordinate[0], y: coordinate[1] }],
              totalPower: 1,
            },
            ...involvedTerritories.filter((t) => t.playerId === playerId),
          ].sort((a, b) => b.totalPower - a.totalPower),
        ];
      }),
    );
    console.log('player territories', JSON.stringify(playerTerritories));
    // iterate over all players, removing 1 power from one of their territories until
    // one or no players remain. for players with multiple territories involved, begin
    // with the most powerful (they are already sorted for this) and alternate each iteration.
    const playerTerritoryIndexes = Object.fromEntries(
      Object.keys(playerTerritories).map<[string, number]>((playerId) => {
        return [playerId, 0];
      }),
    );
    const depletedTerritories: Territory[] = [];
    while (Object.keys(playerTerritories).length > 1) {
      // each round applies to every remaining player
      const playersInThisBattle = Object.keys(playerTerritories);
      for (const playerId of playersInThisBattle) {
        let territoryIndex = playerTerritoryIndexes[playerId];
        const territory = playerTerritories[playerId][territoryIndex];
        territory.totalPower -= 1;
        console.log(
          'subtracted 1 power from',
          playerId,
          'territory',
          territoryIndex,
        );
        // remove power from any cell in the territory which has some available. doesn't
        // matter which cell we choose, since the power is shared.
        for (const cell of territory.cells) {
          if (globalState.grid[cell.y][cell.x].power > 0) {
            globalState.grid[cell.y][cell.x].power -= 1;
            break;
          }
        }
        if (territory.totalPower === 0) {
          console.log('territory depleted', playerId, territoryIndex);
          playerTerritories[playerId].splice(territoryIndex, 1);
          depletedTerritories.push(territory);
          // decrement territory index to avoid skipping over the next
          // territory
          playerTerritoryIndexes[playerId] = --territoryIndex;
          if (playerTerritories[playerId].length === 0) {
            delete playerTerritories[playerId];
          }
        }
        // player may have been removed if their territory was depleted
        if (playerTerritories[playerId]) {
          playerTerritoryIndexes[playerId] =
            (territoryIndex + 1) % playerTerritories[playerId].length;
          console.log(
            'next territory for',
            playerId,
            'is',
            playerTerritoryIndexes[playerId],
          );
        } else {
          playerTerritoryIndexes[playerId] = 0;
        }
      }
    }
    // remove any depleted territories
    for (const territory of depletedTerritories) {
      if (territory.totalPower === 0) {
        for (const cell of territory.cells) {
          globalState.grid[cell.y][cell.x] = {
            playerId: null,
            power: 0,
          };
        }
      }
    }
    // the remaining player takes the cell, if any
    const remainingPlayerId = Object.keys(playerTerritories)[0];
    if (remainingPlayerId) {
      globalState.grid[coordinate[1]][coordinate[0]] = {
        playerId: remainingPlayerId,
        power: 1,
      };
    }

    // the battle is done!
  }

  // apply all placements not in battles
  for (const turn of round.turns) {
    const [placement] = turn.data.placements;
    if (collisionMap[`${placement.x},${placement.y}`].length === 1) {
      globalState.grid[placement.y][placement.x] = {
        playerId: turn.playerId,
        power: 1,
      };
    }
  }

  return globalState;
};

const getRequiredPowerToWin = (playerCount: number) => {
  return 10 + playerCount * 4;
};

const countTotalPowerPerPlayer = (globalState: GlobalState) => {
  const playerPowers: Record<string, number> = {};
  for (const row of globalState.grid) {
    for (const cell of row) {
      if (cell.playerId) {
        playerPowers[cell.playerId] =
          (playerPowers[cell.playerId] || 0) + cell.power;
      }
    }
  }
  return playerPowers;
};
