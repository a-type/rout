import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  type BaseTurnError,
} from '@long-game/game-definition';
import { Placement, PlayerBoard } from './board';
import { generateTiles, Tile } from './tile';
import { applyPlacement, handSize, playedTiles, turnsInGame } from './turns';

export type GlobalState = {
  playerBoards: Record<PrefixedId<'u'>, PlayerBoard>;
  drawPile: Tile[];
};

export type PlayerState = {
  board: PlayerBoard;
  hand: Tile[];
};

export type TurnData = {
  placements: Placement[];
};

export type PublicTurnData = {
  tiles: Tile[];
};

// optional: extend the validation error type with your own metadata
export type TurnError = BaseTurnError;

export const gameDefinition: GameDefinition<{
  // Basic type configuration for a game. Do not remove any of these
  // type parameters; all of them are necessary to correctly infer
  // client types.
  GlobalState: GlobalState;
  PlayerState: PlayerState;
  TurnData: TurnData;
  PublicTurnData: PublicTurnData;
  TurnError: TurnError;
  // optional: define an initial turn data type and getInitialTurnData
  // this is nice if you don't want to always have _some_ data in the turn
  // at all times, rather than checking if turn data is null / the user hasn't played yet.
  // mostly useful for the "update" version of prepare/submit turn, which takes the previous
  // value -- specifying the initial turn means that value will always be defined.
  InitialTurnData: TurnData;
  // optional: define setup data type and getSetupData if your game
  // requires custom setup per game session. setup data is stored statically
  // outside the game state. you can use this for shuffling a starting deck,
  // for example, but be warned that modifications to this definition will
  // NOT retroactively change setup data for running sessions.
  // SetupData: {};
}> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {},
  validatePartialTurn({ playerState, turn }) {
    if (turn.data.placements.length > playedTiles) {
      return `You can only place up to ${playedTiles} tiles per turn.`;
    }
    for (const placement of turn.data.placements) {
      if (!playerState.hand.some((tile) => tile.id === placement.tileId)) {
        return `You don't have tile ${placement.tileId} in your hand.`;
      }
      if (playerState.board[placement.cellKey]) {
        return `Cell ${placement.cellKey} is already occupied.`;
      }
    }
  },

  // run on client

  getInitialTurn() {
    return { placements: [] };
  },
  applyProspectiveTurnToPlayerState: ({ playerState, prospectiveTurn }) => {
    for (const placement of prospectiveTurn.data.placements) {
      applyPlacement({
        board: playerState.board,
        placement,
        tileId: placement.tileId,
        hand: playerState.hand,
      });
    }
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    return {
      playerBoards: Object.fromEntries(
        members.map((member) => [member.id, {} as PlayerBoard]),
      ),
      drawPile: generateTiles(turnsInGame * handSize, random),
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      board: globalState.playerBoards[playerId],
      hand: globalState.drawPile.slice(0, handSize),
    };
  },

  applyRoundToGlobalState: ({ globalState, round }) => {
    for (const turn of round.turns) {
      const board = globalState.playerBoards[turn.playerId];
      if (!board) {
        throw new Error(
          `Player ${turn.playerId} not found in global state. Not validated correctly?`,
        );
      }
      for (const placement of turn.data.placements) {
        applyPlacement({
          board,
          placement,
          tileId: placement.tileId,
          hand: globalState.drawPile,
        });
      }
    }
  },

  getPublicTurn: ({ turn, globalState }) => {
    return {
      ...turn,
      data: {
        tiles: turn.data.placements.map((placement) => {
          const tile = globalState.drawPile.find(
            (tile) => tile.id === placement.tileId,
          );
          if (!tile) {
            throw new Error(
              `Tile ${placement.tileId} not found in turn data. Not validated correctly?`,
            );
          }
          return tile;
        }),
      },
    };
  },

  getStatus: ({ globalState, rounds }) => {
    if (rounds.length >= turnsInGame) {
      return {
        status: 'complete',
        winnerIds: [], // TODO: implement win condition and return winner(s) here
      };
    }

    return {
      status: 'active',
    };
  },
};
