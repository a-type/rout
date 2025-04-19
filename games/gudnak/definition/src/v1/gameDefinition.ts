import { GameDefinition, RoundIndexDecider } from '@long-game/game-definition';
import {
  abilityDefinitions,
  ContinuousEffect,
  EffectInput,
  Target,
  ValidAbilityId,
} from './definitions/abilityDefinition';
import { cardDefinitions, ValidCardId } from './definitions/cardDefinition';
import { deckDefinitions } from './definitions/decks';
import { findMatchingFreeAction } from './gameState/freeAction';
import { draw, shuffleDeck } from './gameState/zone';
import {
  validateDeploy,
  validateMove,
  validateTargets,
} from './gameState/validation';
import { getCardIdsFromBoard, getSpecialSpaces } from './gameState/board';
import { applyTurn } from './gameState/applyTurn';

// re-export definitions used by renderer
export * from './definitions/abilityDefinition';
export * from './definitions/cardDefinition';

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
  continuousEffects: ContinuousEffect[];
};
export type CardStack = string[];
export type Board = CardStack[][];
export type Coordinate = { x: number; y: number };
export type DrawAction = { type: 'draw' };
export type TacticAction = { type: 'tactic'; card: Card; input: EffectInput };
export type DeployAction = { type: 'deploy'; card: Card; target: Coordinate };
export type MoveAction = {
  type: 'move';
  cardInstanceId: string;
  source: Coordinate;
  target: Coordinate;
};
export type UseAbilityAction = {
  type: 'useAbility';
  cardInstanceId: string;
  abilityId: string;
  targets: Target[];
};
export type EndTurnAction = { type: 'endTurn' };
export type Action =
  | DrawAction
  | DeployAction
  | MoveAction
  | EndTurnAction
  | TacticAction
  | UseAbilityAction;

export type FreeAction = {
  type: 'deploy' | 'move';
  cardInstanceId?: string;
  count?: number;
};

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
  freeActions: FreeAction[];
  continuousEffects: ContinuousEffect[];
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
  freeActions: FreeAction[];
};

export type TurnData = {
  action: Action;
};

function anyTurn(): RoundIndexDecider<GlobalState, TurnData> {
  return ({ turns, globalState }) => {
    // rounds advance when any player goes
    // requires us to validate active player in turn validation
    const maxRoundIndex = turns.reduce((max, turn) => {
      return Math.max(max, turn.roundIndex);
    }, 0);

    return {
      roundIndex: maxRoundIndex + 1,
      pendingTurns: [globalState.currentPlayer as `u-${string}`],
    };
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
    const { actions, board, deckCount, active, side, cardState, freeActions } =
      playerState;
    const {
      data: { action },
      playerId,
    } = turn;
    if (!active) {
      return 'Not your turn';
    }
    if (action.type === 'endTurn') {
      if (actions > 0) {
        return 'You have remaining actions you must use';
      }
      return;
    }
    const matchingFreeAction = findMatchingFreeAction(action, freeActions);

    if (actions <= 0 && !matchingFreeAction) {
      return 'You have no actions left';
    }
    if (action.type === 'draw') {
      if (deckCount === 0) {
        return 'You have no cards left in your deck';
      }
      return;
    }
    if (action.type === 'tactic') {
      const card = cardState[action.card.instanceId];
      const cardDef = cardDefinitions[card.cardId as ValidCardId];
      const abilityDef = abilityDefinitions[card.cardId as ValidAbilityId];
      if (!card) {
        return 'Card not found';
      }
      if (card.ownerId !== playerId) {
        return 'You do not own this card';
      }
      if (!cardDef) {
        return 'Card definition not found';
      }
      if (cardDef.kind !== 'tactic' || abilityDef.type !== 'tactic') {
        return 'Card is not a tactic';
      }
      if (actions < cardDef.cost && !matchingFreeAction) {
        return 'You do not have enough actions to play this tactic';
      }
      if ('input' in abilityDef) {
        const targetErrors = validateTargets(
          playerState,
          playerId,
          abilityDef.input.targets,
          action.input.targets,
        );
        if (targetErrors) {
          return targetErrors[0];
        }
      }
      return;
    }
    if (action.type === 'deploy') {
      const deployErrors = validateDeploy(
        board,
        cardState,
        side,
        action.card,
        action.target,
      );
      if (deployErrors) {
        return deployErrors[0];
      }
      return;
    }

    if (action.type === 'move') {
      const card = cardState[action.cardInstanceId];
      const moveErrors = validateMove(
        board,
        playerId,
        cardState,
        card,
        action.source,
        action.target,
      );
      if (moveErrors) {
        return moveErrors[0];
      }
    }

    if (action.type === 'useAbility') {
      const card = cardState[action.cardInstanceId];
      const abilityDef = abilityDefinitions[action.abilityId as ValidAbilityId];
      if (!card) {
        return 'Card not found';
      }
      if (card.ownerId !== playerId) {
        return 'You do not own this card';
      }
      if (!abilityDef) {
        return 'Ability definition not found';
      }
      if ('input' in abilityDef) {
        const targetErrors = validateTargets(
          playerState,
          playerId,
          abilityDef.input.targets,
          action.targets,
        );
        if (targetErrors) {
          return targetErrors[0];
        }
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
        const cards: Card[] = [...deckDefinitions.deck1.list].map((id) => ({
          cardId: id,
          instanceId: random.id(),
          ownerId: member.id,
          fatigued: false,
          continuousEffects: [],
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
      freeActions: [],
      continuousEffects: [],
    };

    // shuffle decks and draw 5 cards for each player
    for (const member of members) {
      state = shuffleDeck(state, random, member.id);
      state = draw(state, member.id, 5);
    }

    return state;
  },

  getPlayerState: ({ globalState, playerId, members }) => {
    const { playerState, currentPlayer, actions, board, freeActions } =
      globalState;
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
      freeActions,
      side,
      specialSpaces: getSpecialSpaces(
        globalState,
        members.map((m) => m.id),
      ),
    };
  },

  applyRoundToGlobalState: ({ globalState, round }) => {
    round.turns.forEach((turn) => {
      globalState = applyTurn(globalState, turn);
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
