import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  simpleError,
} from '@long-game/game-definition';
import {
  applyCellEffect,
  applyValidPlacement,
  GameMap,
  generateRandomMap,
  getMapSize,
  validatePlacement,
} from './map.js';
import {
  FortressPiece,
  generatePieceOptions,
  PiecePlacement,
} from './pieces.js';
import {
  applyUnitAction,
  findUnit,
  UnitAction,
  validateUnitAction,
} from './units.js';

export type GlobalState = {
  mapSize: number;
  tiles: GameMap;
  scores: Record<PrefixedId<'u'>, number>;
  // progress toward next artifact, 0-1
  progress: Record<PrefixedId<'u'>, number>;
  pieceOptions: FortressPiece[];
};

export type PlayerState = {
  mapSize: number;
  tiles: GameMap;
  scores: Record<PrefixedId<'u'>, number>;
  // only your own progress.
  progress: number;
  pieceOptions: FortressPiece[];
};

export type TurnData = {
  piecePlacement: PiecePlacement | null;
  unitActions: Record<string, UnitAction[]>;
};

// optional: extend the validation error type with your own metadata
export type TurnError =
  | {
      code: string;
      message: string;
    }
  | {
      code: 'unit-error';
      message: string;
      data: {
        unitId: string;
      };
    };

export const gameDefinition: GameDefinition<{
  GlobalState: GlobalState;
  PlayerState: PlayerState;
  TurnData: TurnData;
  PublicTurnData: { empty: true };
  TurnError: TurnError;
  InitialTurnData: TurnData;
}> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 6,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {},
  validatePartialTurn: ({ playerState, turn }) => {
    for (const [unitId, actions] of Object.entries(turn.data.unitActions)) {
      const { unit, position } = findUnit(playerState.tiles, unitId) || {};
      if (!unit || !position) {
        return simpleError(`One of the units you moved is not on the board`);
      }
      for (const action of actions) {
        const err = validateUnitAction({
          unit,
          position,
          action,
          tiles: playerState.tiles,
        });
        if (err) {
          return err;
        }
      }
    }
    if (turn.data.piecePlacement) {
      const piece = playerState.pieceOptions.find(
        (opt) => opt.id === turn.data.piecePlacement?.pieceId,
      );
      if (!piece) {
        return simpleError('You do not have that piece available to place');
      }
      const placementError = validatePlacement({
        map: playerState.tiles,
        piece,
        origin: turn.data.piecePlacement.origin,
        playerId: turn.playerId,
      });
      if (placementError) {
        return placementError;
      }
    }
  },

  getInitialTurn: () => ({
    piecePlacement: null,
    unitActions: {},
  }),

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    if (prospectiveTurn.data.piecePlacement) {
      applyValidPlacement({
        map: playerState.tiles,
        placement: prospectiveTurn.data.piecePlacement,
        options: playerState.pieceOptions,
        playerId: prospectiveTurn.playerId,
      });
      playerState.pieceOptions = playerState.pieceOptions.filter(
        (option) => option.id !== prospectiveTurn.data.piecePlacement?.pieceId,
      );
    }
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    return {
      mapSize: getMapSize(members.length),
      pieceOptions: generatePieceOptions(random, 0),
      progress: Object.fromEntries(members.map(({ id }) => [id, 0] as const)),
      scores: Object.fromEntries(members.map(({ id }) => [id, 0] as const)),
      tiles: generateRandomMap(
        members.map(({ id }) => id),
        random,
      ),
      units: {},
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      mapSize: globalState.mapSize,
      pieceOptions: globalState.pieceOptions,
      progress: globalState.progress[playerId],
      scores: globalState.scores,
      // TODO: fog of war, etc
      tiles: globalState.tiles,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    const roundUnitActions = round.turns.flatMap((turn) =>
      Object.entries(turn.data.unitActions).flatMap(([unitId, actions]) =>
        actions.map((action) => ({
          unitId,
          action,
          playerId: turn.playerId,
        })),
      ),
    );

    const moveActions = roundUnitActions.filter(
      ({ action }) => action.action === 'move',
    );
    const attackActions = roundUnitActions.filter(
      ({ action }) => action.action === 'attack',
    );

    // before we begin, snapshot initial map
    const initialMap = structuredClone(globalState.tiles);
    const currentMap = globalState.tiles;

    // moves are resolved first
    moveActions.forEach(({ unitId, action, playerId }) => {
      const found = findUnit(currentMap, unitId);
      if (!found) {
        throw new Error(`Unit ${unitId} not found for player ${playerId}`);
      }
      const { unit, position } = found;
      applyUnitAction({
        unit,
        action,
        position,
        tiles: currentMap,
      });
    });

    // then attacks
    attackActions.forEach(({ unitId, action, playerId }) => {
      const found = findUnit(currentMap, unitId);
      if (!found) {
        throw new Error(`Unit ${unitId} not found for player ${playerId}`);
      }
      const { unit, position } = found;
      applyUnitAction({
        unit,
        action,
        position,
        tiles: currentMap,
      });
    });

    // process dead units and destroyed tiles
    for (const tile of Object.values(currentMap)) {
      for (const unit of tile.units) {
        if (unit.health <= 0) {
          unit.diedRoundIndex = round.roundIndex;
        }
      }
      if (tile.fortress && tile.fortress.health <= 0) {
        tile.fortress.destroyedRoundIndex = round.roundIndex;
      }
    }

    // process other tile effects
    for (const tile of Object.values(currentMap)) {
      applyCellEffect({ cell: tile, random, progress: globalState.progress });
    }

    // convert player workshop progress to points
    for (const member of members) {
      const workshopProgress = globalState.progress[member.id];
      globalState.scores[member.id] += Math.floor(workshopProgress);
      globalState.progress[member.id] -= Math.floor(workshopProgress);
    }

    return {
      ...globalState,
      tiles: currentMap,
    };
  },

  getPublicTurn: ({ turn }) => {
    return { ...turn, data: { empty: true } };
  },

  getStatus: ({ globalState, rounds }) => {
    // TODO: when is the game over? who won?
    return {
      status: 'active',
    };
  },
};
