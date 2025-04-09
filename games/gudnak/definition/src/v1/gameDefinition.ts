import {
  GameDefinition,
  roundFormat,
  RoundIndexDecider,
} from '@long-game/game-definition';
import { deckDefinitions } from './decks';
import {
  canDeploy,
  validateMove,
  deploy,
  draw,
  move,
  shuffleDeck,
  spendActions,
} from './gameStateHelpers';

export type Card = {
  cardId: string;
  instanceId: string;
  ownerId: string;
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
type EndTurnAction = { type: 'endTurn' };
type Action = DrawAction | DeployAction | MoveAction | EndTurnAction;

type PlayerHiddenState = {
  deck: Card[];
  hand: Card[];
  discard: Card[];
};

export type GlobalState = {
  board: Board;
  playerState: Record<string, PlayerHiddenState>;
  playerOrder: string[];
  currentPlayer: string;
  actions: number;
};

export type PlayerState = {
  board: Board;
  hand: Card[];
  discard: Card[];
  deckCount: number;
  active: boolean;
  actions: number;
};

export type TurnData = {
  action: Action;
};

function anyTurn(): RoundIndexDecider<GlobalState, TurnData> {
  return ({ turns, members }) => {
    // rounds advance when all members have played a turn
    const maxRoundIndex = turns.reduce((max, turn) => {
      return Math.max(max, turn.roundIndex);
    }, 0);

    return maxRoundIndex + 1;
  };
}

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 2,
  getRoundIndex: anyTurn(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    const { actions, board, deckCount, active } = playerState;
    const {
      data: { action },
    } = turn;
    if (!active) {
      return 'Not your turn';
    }
    if (action.type === 'endTurn') {
      if (actions > 0) {
        return 'You have actions left';
      }
      return;
    }
    if (actions <= 0) {
      return 'You have no actions left';
    }
    if (action.type === 'draw') {
      if (deckCount === 0) {
        return 'You have no cards left in your deck';
      }
      return;
    }
    if (action.type === 'deploy') {
      if (!canDeploy(board, action.card, action.target)) {
        return 'Invalid deploy';
      }
    }

    if (action.type === 'move') {
      const moveError = validateMove(
        board,
        action.card,
        action.source,
        action.target,
      );
      if (moveError) {
        return moveError;
      }
    }
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // TODO: this is what the player sees as the game state
    // with their pending local moves applied after selecting them
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    const playerOrder = random.shuffle(members.map((m) => m.id));
    let state = {
      board: Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => [] as CardStack),
      ),
      playerState: members.reduce((acc, member) => {
        acc[member.id] = {
          deck: [...deckDefinitions.deck1.list].map((id) => ({
            cardId: id,
            instanceId: random.id(),
            ownerId: member.id,
          })),
          hand: [],
          discard: [],
        };
        return acc;
      }, {} as Record<string, PlayerHiddenState>),
      playerOrder,
      currentPlayer: playerOrder[0],
      actions: 2,
    };

    // shuffle decks and draw 5 cards for each player
    for (const member of members) {
      state = shuffleDeck(state, random, member.id);
      state = draw(state, member.id, 5);
    }

    return state;
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      board: globalState.board,
      hand: globalState.playerState[playerId].hand,
      discard: globalState.playerState[playerId].discard,
      deckCount: globalState.playerState[playerId].deck.length,
      active: globalState.currentPlayer === playerId,
      actions: globalState.actions,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    round.turns.forEach((turn) => {
      const { action } = turn.data;
      const playerId = turn.playerId;

      switch (action.type) {
        case 'draw': {
          globalState = draw(globalState, playerId, 1);
          globalState = spendActions(globalState);
          break;
        }
        case 'deploy': {
          globalState = deploy(globalState, action.card, action.target);
          globalState = spendActions(globalState);
          break;
        }
        case 'move': {
          globalState = move(
            globalState,
            action.card,
            action.source,
            action.target,
          );
          globalState = spendActions(globalState);
          break;
        }
        case 'endTurn': {
          const playerIdx = globalState.playerOrder.indexOf(playerId);
          const nextPlayerIdx =
            (playerIdx + 1) % globalState.playerOrder.length;
          globalState = {
            ...globalState,
            currentPlayer: globalState.playerOrder[nextPlayerIdx],
            actions: 2,
          };
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
