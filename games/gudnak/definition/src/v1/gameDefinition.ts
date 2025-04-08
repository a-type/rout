import { GameDefinition, roundFormat } from '@long-game/game-definition';
import { deckDefinitions } from './decks';
import { deploy, draw, shuffleDeck } from './gameStateHelpers';
import { v4 as uuid } from 'uuid';

export type Card = {
  cardId: string;
  instanceId: string;
};
export type CardStack = Card[];
export type Board = CardStack[][];
export type Coordinate = { x: number; y: number };
type DrawAction = { type: 'draw' };
type DeployAction = { type: 'deploy'; card: Card; target: Coordinate };
type MoveAction = {
  type: 'move';
  card: Card;
  source: Coordinate;
  target: Coordinate;
};
type Action = DrawAction | DeployAction | MoveAction;

type PlayerHiddenState = {
  deck: Card[];
  hand: Card[];
  discard: Card[];
};

export type GlobalState = {
  board: Board;
  playerState: Record<string, PlayerHiddenState>;
  currentPlayer: string;
  actions: number;
};

export type PlayerState = {
  board: Board;
  hand: Card[];
  discard: Card[];
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
    let state = {
      board: Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => [] as CardStack),
      ),
      playerState: members.reduce((acc, member) => {
        acc[member.id] = {
          deck: [...deckDefinitions.deck1.list].map((id) => ({
            cardId: id,
            instanceId: uuid(),
          })),
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
    round.turns.forEach((turn) => {
      const { action } = turn.data;
      const playerId = turn.playerId;

      switch (action.type) {
        case 'draw': {
          globalState = draw(globalState, playerId, 1);
          break;
        }
        case 'deploy': {
          globalState = deploy(globalState, action.card, action.target);
          break;
        }
      }
    });
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
