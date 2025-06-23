import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  RoundIndexDecider,
  SystemChatMessage,
} from '@long-game/game-definition';
import {
  abilityDefinitions,
  CardTarget,
  ContinuousEffect,
  EffectInput,
  Target,
  ValidAbilityId,
} from './definitions/abilityDefinition';
import { cardDefinitions, ValidCardId } from './definitions/cardDefinition';
import { deckDefinitions } from './definitions/decks';
import { applyTurn } from './gameState/applyTurn';
import { getCardDefinitionFromInstanceId } from './gameState/card';
import { findMatchingFreeAction } from './gameState/freeAction';
import { checkFatigue } from './gameState/gameStateHelpers';
import { generateInitialGameState } from './gameState/generate';
import { getPlayerState } from './gameState/getPlayerState';
import {
  validateDefend,
  validateDeploy,
  validateMove,
  validateTargets,
} from './gameState/validation';

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
export type AttackAction = {
  type: 'attack';
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
export type DefendAction = {
  type: 'defend';
  targets: CardTarget[];
};
export type EndTurnAction = { type: 'endTurn' };
export type Action =
  | DrawAction
  | DeployAction
  | MoveAction
  | AttackAction
  | EndTurnAction
  | TacticAction
  | UseAbilityAction
  | DefendAction;

export type FreeAction = {
  type: 'deploy' | 'move';
  cardInstanceId?: string;
  count?: number;
};

export type PlayerSelfState = {
  deck: string[];
  hand: string[];
  discard: string[];
  side: Side;
  // Track each player's initial turn to know when they should only get one action.
  hasTakenTurn: boolean;
};

export type GlobalState = {
  board: Board;
  cardState: Record<string, Card>;
  playerState: Record<string, PlayerSelfState>;
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
  playerState: Record<string, PlayerSelfState>;
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
    }, -1);

    return {
      roundIndex: maxRoundIndex + 1,
      pendingTurns: [globalState.currentPlayer as PrefixedId<'u'>],
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

    // Below items require an action
    if (actions <= 0 && !matchingFreeAction) {
      return 'You have no actions left';
    }
    if (action.type === 'draw') {
      if (deckCount === 0) {
        return 'You have no cards left in your deck';
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

    if (action.type === 'defend') {
      const defendErrors = validateDefend(playerState, playerId, action);
      if (defendErrors) {
        return defendErrors[0];
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

  getRoundChangeMessages: ({ completedRound, globalState }) => {
    const messages: SystemChatMessage[] = [];
    type RenderPlayer = (id: string) => string;
    type RenderCard = (id: string) => string;
    type RenderCoordinate = (coord: Coordinate) => string;
    type RenderFn = (props: {
      renderPlayer: RenderPlayer;
      renderCard: RenderCard;
      renderCoordinate: RenderCoordinate;
      renderTarget: (target: Target) => string;
    }) => string;
    const addMessage = (fn: RenderFn): void => {
      const simpleMessage = fn({
        renderPlayer: (id) => id,
        renderCard: (id) =>
          getCardDefinitionFromInstanceId(globalState, id)?.name,
        renderCoordinate: (coord) => `(${coord.x},${coord.y})`,
        renderTarget: (target) => {
          if (target.kind === 'coordinate') {
            return `(${target.x},${target.y})`;
          }
          return getCardDefinitionFromInstanceId(globalState, target.instanceId)
            ?.name;
        },
      });
      const richMessage = fn({
        renderPlayer: (id) => `<player|${id}>`,
        renderCard: (id) => `<card|${id}>`,
        renderCoordinate: (coord) => `<coordinate|${coord.x},${coord.y}>`,
        renderTarget: (target) => {
          if (target.kind === 'coordinate') {
            return `<coordinate|${target.x},${target.y}>`;
          }
          return `<card|${target.instanceId}>`;
        },
      });
      messages.push({
        content: simpleMessage,
        metadata: {
          richContent: richMessage,
        },
      });
    };
    completedRound?.turns.forEach((turn) => {
      const {
        data: { action },
        playerId,
      } = turn;
      if (action.type === 'attack') {
        addMessage(({ renderPlayer, renderCard, renderCoordinate }) => {
          return `${renderPlayer(playerId)} attacked with ${renderCard(
            action.cardInstanceId,
          )} from ${renderCoordinate(action.source)} to ${renderCoordinate(
            action.target,
          )}`;
        });
      }
      if (action.type === 'move') {
        addMessage(({ renderPlayer, renderCard, renderCoordinate }) => {
          return `${renderPlayer(playerId)} moved ${renderCard(
            action.cardInstanceId,
          )} from ${renderCoordinate(action.source)} to ${renderCoordinate(
            action.target,
          )}`;
        });
      }
      if (action.type === 'deploy') {
        addMessage(({ renderPlayer, renderCard, renderCoordinate }) => {
          return `${renderPlayer(playerId)} deployed ${renderCard(
            action.card.instanceId,
          )} to ${renderCoordinate(action.target)}`;
        });
      }
      if (action.type === 'draw') {
        addMessage(({ renderPlayer }) => {
          return `${renderPlayer(playerId)} drew a card`;
        });
      }
      if (action.type === 'endTurn') {
        addMessage(({ renderPlayer }) => {
          return `${renderPlayer(playerId)} ended their turn`;
        });
      }
      if (action.type === 'tactic') {
        addMessage(({ renderPlayer, renderCard, renderTarget }) => {
          let msg = `${renderPlayer(playerId)} played ${renderCard(
            action.card.instanceId,
          )}`;
          if (action.input.targets.length > 0) {
            msg += ` with targets ${action.input.targets
              .map((t) => renderTarget(t))
              .join(', ')}`;
          }
          return msg;
        });
      }
      if (action.type === 'useAbility') {
        addMessage(({ renderPlayer, renderCard, renderTarget }) => {
          let msg = `${renderPlayer(playerId)} used ${renderCard(
            action.cardInstanceId,
          )}'s ability`;
          if (action.targets.length > 0) {
            msg += ` with targets ${action.targets
              .map((t) => renderTarget(t))
              .join(', ')}`;
          }
          return msg;
        });
      }
      if (action.type === 'defend') {
        addMessage(({ renderPlayer, renderTarget }) => {
          return `${renderPlayer(playerId)} defended with ${action.targets
            .map((t) => renderTarget(t))
            .join(', ')}`;
        });
      }
    });
    return messages;
  },

  getStatus: ({ globalState }) => {
    if (globalState.winner) {
      return {
        status: 'complete',
        winnerIds: [globalState.winner as PrefixedId<'u'>],
      };
    }
    return {
      status: 'active',
    };
  },
};
