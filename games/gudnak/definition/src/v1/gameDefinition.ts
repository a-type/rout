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
import {
  validateDeploy,
  validateMove,
  validateTargets,
} from './gameState/validation';
import { applyTurn } from './gameState/applyTurn';
import { generateInitialGameState } from './gameState/generate';
import { getPlayerState } from './gameState/getPlayerState';
import { checkFatigue } from './gameState/gameStateHelpers';

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
  cardId: ValidCardId;
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
  source: Coordinate;
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

export type PlayerHiddenState = {
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
  winner: string | null;
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
          null,
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
      if (checkFatigue(card)) {
        return 'Card is fatigued';
      }
      if ('input' in abilityDef) {
        const targetErrors = validateTargets(
          playerState,
          playerId,
          action.source,
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
    return generateInitialGameState({
      members,
      random,
      decklists: Object.fromEntries(
        members.map((m) => [m.id, deckDefinitions['deck1']]),
      ),
    });
  },

  getPlayerState: ({ globalState, playerId, members }) => {
    return getPlayerState({
      globalState,
      playerId,
      members,
    });
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

  getStatus: ({ globalState }) => {
    if (globalState.winner) {
      return {
        status: 'completed',
        winnerIds: [globalState.winner],
      };
    }
    return {
      status: 'active',
    };
  },
};
