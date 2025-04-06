import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { deckDefinitions } from './decks';
import { draw, shuffleDeck } from './gameStateHelpers';

type Board = Record<string, string[]>;
type DrawAction = { type: 'draw' };
type DeployAction = { type: 'deploy'; cardId: string; target: string };
type MoveAction = { type: 'move'; cardId: string; target: string };
type Action = DrawAction | DeployAction | MoveAction;

type PlayerHiddenState = {
  deck: string[];
  hand: string[];
  discard: string[];
};

export type GlobalState = {
  board: Board;
  playerState: Record<string, PlayerHiddenState>;
  currentPlayer: string;
  actions: number;
};

export type PlayerState = {
  board: Board;
  hand: string[];
  discard: string[];
};

export type TurnData = {
  action: Action;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 1,
  maximumPlayers: 2,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    // TODO: return error string if the moves are invalid
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members }) => {
    // TODO: return the initial global state. possibly randomizing initial conditions.
    let state = {
      board: {},
      playerState: members.reduce((acc, member) => {
        acc[member.id] = {
          deck: [...deckDefinitions.deck1.list],
          hand: [],
          discard: [],
        };
        return acc;
      }, {} as Record<string, PlayerHiddenState>),
      currentPlayer: members[0].id,
      actions: 0,
    };

    // shuffle decks and draw 5 cards for each player
    for (const member of members) {
      state = shuffleDeck(state, member.id);
      state = draw(state, member.id, 5);
    }

    return state;
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      board: globalState.board,
      hand: globalState.playerState[playerId].hand,
      discard: globalState.playerState[playerId].discard,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    return globalState;
  },

  getPublicTurn: ({ turn }) => {
    return turn;
  },

  getStatus: ({ globalState, rounds }) => {
    return {
      status: 'active',
    };
  },
};
