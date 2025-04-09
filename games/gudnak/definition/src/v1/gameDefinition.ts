import { GameDefinition, RoundIndexDecider } from '@long-game/game-definition';
import { deckDefinitions } from './decks';
import {
  validateDeploy,
  validateMove,
  deploy,
  draw,
  move,
  shuffleDeck,
  spendActions,
  getSpecialSpaces,
  getGatesCoord,
  getTopCard,
  getStack,
  mill,
  getCardIdsFromBoard,
} from './gameStateHelpers';

export type Side = 'top' | 'bottom';

type SpaceType = 'gate' | 'backRow' | 'none';
export type Space = {
  coordinate: Coordinate;
  type: SpaceType;
  ownerId: string | null;
};

export type Card = {
  cardId: string;
  instanceId: string;
  ownerId: string;
  fatigued: boolean;
};
export type CardStack = string[];
export type Board = CardStack[][];
export type Coordinate = { x: number; y: number };
type DrawAction = { type: 'draw' };
type DeployAction = { type: 'deploy'; card: Card; target: Coordinate };
type MoveAction = {
  type: 'move';
  cardInstanceId: string;
  source: Coordinate;
  target: Coordinate;
};
type EndTurnAction = { type: 'endTurn' };
type Action = DrawAction | DeployAction | MoveAction | EndTurnAction;

type PlayerHiddenState = {
  deck: string[];
  hand: string[];
  discard: string[];
  side: Side;
};

export type GlobalState = {
  board: Board;
  cardState: Record<string, Card>;
  playerState: Record<string, PlayerHiddenState>;
  playerOrder: string[];
  currentPlayer: string;
  actions: number;
};

export type PlayerState = {
  board: Board;
  cardState: Record<string, Card>;
  specialSpaces: Space[];
  hand: Card[];
  discard: Card[];
  deckCount: number;
  active: boolean;
  actions: number;
  side: Side;
};

export type TurnData = {
  action: Action;
};

function anyTurn(): RoundIndexDecider<GlobalState, TurnData> {
  return ({ turns, members }) => {
    // rounds advance when any player goes
    // requires us to validate active player in turn validation
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
    const { actions, board, deckCount, active, side, cardState } = playerState;
    const {
      data: { action },
      playerId,
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
      const deployError = validateDeploy(
        board,
        cardState,
        side,
        action.card,
        action.target,
      );
      if (deployError) {
        return deployError;
      }
      return;
    }

    if (action.type === 'move') {
      const card = cardState[action.cardInstanceId];
      const moveError = validateMove(
        board,
        playerId,
        cardState,
        card,
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
    const cardState: Record<string, Card> = {};
    let state: GlobalState = {
      board: Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => [] as CardStack),
      ),
      cardState,
      playerState: members.reduce((acc, member, idx) => {
        const cards = [...deckDefinitions.deck1.list].map((id) => ({
          cardId: id,
          instanceId: random.id(),
          ownerId: member.id,
          fatigued: false,
        }));
        cards.forEach((card) => (cardState[card.instanceId] = card));
        acc[member.id] = {
          deck: cards.map((c) => c.instanceId),
          hand: [],
          discard: [],
          side: idx === 0 ? 'top' : 'bottom',
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

  getPlayerState: ({ globalState, playerId, members }) => {
    const { playerState, currentPlayer, actions, board } = globalState;
    const { hand, deck, discard, side } = playerState[playerId];
    const visibleCardIds = [...hand, ...discard, ...getCardIdsFromBoard(board)];
    return {
      board,
      cardState: visibleCardIds.reduce((acc, id) => {
        acc[id] = globalState.cardState[id];
        return acc;
      }, {} as Record<string, Card>),
      hand: hand.map((instanceId) => globalState.cardState[instanceId]),
      discard: discard.map((instanceId) => globalState.cardState[instanceId]),
      deckCount: deck.length,
      active: currentPlayer === playerId,
      actions,
      side,
      specialSpaces: getSpecialSpaces(
        globalState,
        members.map((m) => m.id),
      ),
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
          globalState = deploy(
            globalState,
            action.card.instanceId,
            action.target,
          );
          globalState = spendActions(globalState);
          break;
        }
        case 'move': {
          globalState = move(
            globalState,
            action.cardInstanceId,
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
          const nextPlayer = globalState.playerOrder[nextPlayerIdx];
          globalState = {
            ...globalState,
            currentPlayer: nextPlayer,
            actions: 2,
          };
          // Remove fatigue from all cards in the board
          globalState = {
            ...globalState,
            cardState: Object.fromEntries(
              Object.entries(globalState.cardState).map(([id, card]) => [
                id,
                {
                  ...card,
                  fatigued: false,
                },
              ]),
            ),
          };

          const siegeLocation = getGatesCoord(
            globalState.playerState[nextPlayer].side,
          );
          const siegeCardId = getTopCard(
            getStack(globalState.board, siegeLocation),
          );
          const siegeCardOwner = siegeCardId
            ? globalState.cardState[siegeCardId]?.ownerId
            : null;

          if (!siegeCardOwner || siegeCardOwner === nextPlayer) {
            globalState = draw(globalState, nextPlayer);
          } else {
            globalState = mill(globalState, nextPlayer);
          }
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
