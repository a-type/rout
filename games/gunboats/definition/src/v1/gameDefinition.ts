import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  type BaseTurnError,
} from '@long-game/game-definition';
import {
  Action,
  ActionTaken,
  applyActionTaken,
  drawRandomActions,
  validateAction,
} from './actions';
import { Board, getPlayerBoardView, serializePosition } from './board';
import { getAllShipParts, placeShip } from './ships';

export type GlobalState = {
  board: Board;
  draftOptionsByPlayer: Record<PrefixedId<'u'>, Action[]>;
};

export type PlayerState = {
  // other players ships will be hidden
  board: Board;
  draftOptions: Action[];
};

export type TurnData = {
  actions: ActionTaken[];
};

// optional: extend the validation error type with your own metadata
export type TurnError = BaseTurnError;

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData,
  TurnError,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    const { actions } = turn.data;
    if (actions.length !== 3) {
      return {
        code: 'wrong-count-actions',
        message: 'You must take 3 actions per turn.',
      };
    }
  },
  validatePartialTurn: ({ playerState, turn }) => {
    const newState = structuredClone(playerState);
    for (const actionTaken of turn.data.actions) {
      const { id } = actionTaken;
      const action = playerState.draftOptions.find((a) => a.id === id);
      if (!action) {
        return {
          code: 'invalid-action',
          message: `Action with id ${id} is not valid.`,
        };
      }
      const err = validateAction({
        playerId: turn.playerId,
        action,
        taken: actionTaken,
        board: newState.board,
      });
      if (err) {
        return err;
      }
      newState.board = applyActionTaken({
        action,
        actionTaken,
        board: newState.board,
        playerId: turn.playerId,
      });
    }
  },
  getInitialTurn: () => ({
    actions: [],
  }),

  // run on client

  getProspectivePlayerState: ({ playerState, playerId, prospectiveTurn }) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
    const newState = structuredClone(playerState);
    const movedShips = prospectiveTurn.data.actions
      .filter((action) => action.type === 'move')
      .map((action) => action.shipId);
    const placedShipParts = prospectiveTurn.data.actions
      .filter((action) => action.type === 'ship')
      .map((taken) => {
        const action = playerState.draftOptions.find((a) => a.id === taken.id);
        if (!action || action.type !== 'ship') {
          throw new Error(`Action with id ${taken.id} is not a ship action`);
        }
        return placeShip({
          orientation: taken.orientation,
          position: taken.position,
          shipLength: action.shipLength,
        }).map((part) => ({
          ...part,
          shipId: `pending-place-${taken.id}`,
          shipLength: action.shipLength,
        }));
      })
      .flat();

    for (const moved of movedShips) {
      const allParts = getAllShipParts(moved, newState.board);
      for (const part of allParts) {
        const key = serializePosition(part.position);
        if (newState.board.cells[key]) {
          newState.board.cells[key].movedAway = true;
        }
      }
    }

    for (const part of placedShipParts) {
      const key = serializePosition(part.position);
      if (!newState.board.cells[key]) {
        newState.board.cells[key] = {};
      }
      newState.board.cells[key]!.placedShipPart = {
        hit: false,
        isCenter: part.isCenter,
        partIndex: part.partIndex,
        shipId: part.shipId,
        totalLength: part.shipLength,
        playerId,
      };
    }

    return {
      ...newState,
      board: newState.board,
    };
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
    return {
      board: {
        cells: {},
        size: 20,
      },
      draftOptionsByPlayer: Object.fromEntries(
        members.map(({ id }) => [
          id,
          [
            { type: 'ship', shipLength: 1, id: random.id() },
            { type: 'ship', shipLength: 3, id: random.id() },
            { type: 'ship', shipLength: 5, id: random.id() },
          ],
        ]),
      ),
    };
  },

  getPlayerState: ({ globalState, playerId }) => {
    // TODO: compute the player state from the global state
    return {
      board: getPlayerBoardView(globalState.board, playerId),
      draftOptions: globalState.draftOptionsByPlayer[playerId] ?? [],
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    const actionsById = globalState.draftOptionsByPlayer;
    const allActions = round.turns.flatMap((turn) =>
      turn.data.actions.map((taken) => ({
        actionTaken: taken,
        action: actionsById[turn.playerId].find((a) => a.id === taken.id)!,
        playerId: turn.playerId,
      })),
    );
    const groupedActions = allActions.reduce(
      (acc, entry) => {
        acc[entry.action.type].push(entry);
        return acc;
      },
      {
        ship: [],
        move: [],
        fire: [],
      } as Record<
        Action['type'],
        {
          actionTaken: ActionTaken;
          action: Action;
          playerId: PrefixedId<'u'>;
        }[]
      >,
    );
    let newBoard = structuredClone(globalState.board);
    for (const { actionTaken, action, playerId } of groupedActions.ship) {
      newBoard = applyActionTaken({
        action,
        actionTaken,
        board: newBoard,
        playerId,
      });
    }
    for (const { actionTaken, action, playerId } of groupedActions.move) {
      newBoard = applyActionTaken({
        action,
        actionTaken,
        board: newBoard,
        playerId,
      });
    }
    for (const { actionTaken, action, playerId } of groupedActions.fire) {
      newBoard = applyActionTaken({
        action,
        actionTaken,
        board: newBoard,
        playerId,
      });
    }
    return {
      ...globalState,
      board: newBoard,
      draftOptionsByPlayer: Object.fromEntries(
        members.map((member) => [member.id, drawRandomActions(random, 3)]),
      ),
    };
  },

  getPublicTurn: ({ turn }) => {
    // TODO: process full turn data into what players can see
    // (i.e. what should you know about other players' turns?)
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    // TODO: when is the game over? who won?
    return {
      status: 'active',
    };
  },
};
