import { isPrefixedId, PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  type BaseTurnError,
} from '@long-game/game-definition';
import { Placement, PlayerBoard } from './board';
import { eventToChatMessage, PathEvent } from './events';
import { getDistinctPaths, scoreBoard } from './scoring';
import { generateTiles, Tile } from './tile';
import {
  applyPlacement,
  getRoundHand,
  handSize,
  hasAnyValidPlacement,
  turnsInGame,
  validatePathToTermination,
  withPlacement,
} from './turns';

export type GlobalState = {
  playerBoards: Record<PrefixedId<'u'>, PlayerBoard>;
  drawPile: Tile[];
  lastRoundEvents: PathEvent[];
};

export type PlayerState = {
  board: PlayerBoard;
  otherPlayers: { playerId: PrefixedId<'u'>; board: PlayerBoard }[];
  hand: Tile[];
};

export type TurnData = {
  placements: Placement[];
};

export type PublicTurnData = TurnData;

// optional: extend the validation error type with your own metadata
export type TurnErrorData = {
  invalidCellKey?: string;
};
export type TurnErrorCodes = 'invalid_placement';
export type TurnError = BaseTurnError<TurnErrorData, TurnErrorCodes>;

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
    for (const placement of turn.data.placements) {
      if (!playerState.hand.some((tile) => tile.id === placement.tileId)) {
        return `You don't have tile ${placement.tileId} in your hand.`;
      }
      if (playerState.board[placement.cellKey]) {
        return `Cell ${placement.cellKey} is already occupied.`;
      }
    }
    const violatingPlacement = validatePathToTermination({
      board: playerState.board,
      placements: turn.data.placements,
      hand: playerState.hand,
    });
    if (violatingPlacement) {
      return {
        message: `All tiles must connect to the edge of the board.`,
        data: {
          invalidCellKey: violatingPlacement.cellKey,
        },
        code: 'invalid_placement',
      };
    }
    // players must play all tiles in their hand which have valid placement
    // available.
    const playedTileIds = turn.data.placements.map((p) => p.tileId);
    const boardWithPlacements = turn.data.placements.reduce(
      (board, placement) => {
        return withPlacement({ board, placement, hand: playerState.hand })
          .board;
      },
      playerState.board,
    );
    const unplayedTiles = playerState.hand.filter(
      (tile) =>
        !playedTileIds.includes(tile.id) &&
        // check if tile has any valid placements
        hasAnyValidPlacement({
          board: boardWithPlacements,
          tile,
        }),
    );
    if (unplayedTiles.length > 0) {
      return `You must play all tiles that have a valid placement. You have ${unplayedTiles.length} unplayed tile(s) that could be placed.`;
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
      drawPile: generateTiles(turnsInGame * handSize * 2, random),
      lastRoundEvents: [],
    };
  },

  getPlayerState: ({ globalState, roundIndex, playerId }) => {
    return {
      board: globalState.playerBoards[playerId],
      hand: getRoundHand({ globalState, roundIndex }),
      otherPlayers: Object.entries(globalState.playerBoards)
        .filter(([id]) => id !== playerId)
        .map(([playerId, board]) => ({
          playerId: playerId as PrefixedId<'u'>,
          board,
        })),
    };
  },

  applyRoundToGlobalState: ({ globalState, round, roundIndex }) => {
    globalState.lastRoundEvents = []; // reset events for the new round
    for (const turn of round.turns) {
      const board = globalState.playerBoards[turn.playerId];
      const originalBoard = { ...board };

      if (!board) {
        throw new Error(
          `Player ${turn.playerId} not found in global state. Not validated correctly?`,
        );
      }
      for (const placement of turn.data.placements) {
        applyPlacement({
          board,
          placement,
          hand: getRoundHand({ globalState, roundIndex: roundIndex }),
        });
      }

      // detect events from boards
      const originalPathIds = new Set(
        getDistinctPaths(originalBoard).map((p) => p.id),
      );
      const newPaths = getDistinctPaths(board);

      const completedPaths = newPaths.filter(
        (p) => p.isComplete && !originalPathIds.has(p.id),
      );
      const brokenPaths = newPaths.filter(
        (p) => p.breaks.length > 0 && originalPathIds.has(p.id),
      );

      const events: PathEvent[] = [
        ...completedPaths.map((p) => ({
          type: 'completed' as const,
          playerId: turn.playerId,
          pathId: p.id,
        })),
        ...brokenPaths.map((p) => ({
          type: 'broken' as const,
          playerId: turn.playerId,
          pathId: p.id,
        })),
      ];

      globalState.lastRoundEvents.push(...events);
    }
  },

  getPublicTurn: ({ turn, globalState }) => {
    return turn;
  },

  getStatus: ({ globalState, rounds, members }) => {
    if (
      rounds.length >= turnsInGame &&
      members.every((m) =>
        rounds[rounds.length - 1].turns.some((t) => t.playerId === m.id),
      )
    ) {
      const playerScores = Object.entries(globalState.playerBoards).map(
        ([playerId, board]) => {
          const score = scoreBoard(board);
          return { playerId, score };
        },
      );
      const maxScore = Math.max(...playerScores.map((ps) => ps.score));
      const winnerIds = playerScores
        .filter((ps) => ps.score === maxScore)
        .map((ps) => ps.playerId)
        .filter((id) => isPrefixedId(id, 'u'));
      return {
        status: 'complete',
        winnerIds,
      };
    }

    return {
      status: 'active',
    };
  },

  getRoundChangeMessages({ globalState }) {
    return globalState.lastRoundEvents
      .map((event) => eventToChatMessage(event, globalState))
      .filter((m) => !!m);
  },
};
