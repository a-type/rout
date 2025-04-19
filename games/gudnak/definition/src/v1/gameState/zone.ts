import { GameRandom } from '@long-game/game-definition';
import type { Card, GlobalState } from '../gameDefinition';

export function draw(
  globalState: GlobalState,
  playerId: string,
  count: number = 1,
): GlobalState {
  const playerState = globalState.playerState[playerId];
  if (playerState.deck.length === 0) {
    return globalState;
  }
  const drawnCards = playerState.deck.slice(0, count);
  const remainingDeck = playerState.deck.slice(count);
  return {
    ...globalState,
    playerState: {
      ...globalState.playerState,
      [playerId]: {
        ...playerState,
        deck: remainingDeck,
        hand: [...playerState.hand, ...drawnCards],
      },
    },
  };
}

export function shuffleDeck(
  globalState: GlobalState,
  random: GameRandom,
  playerId: string,
): GlobalState {
  const { deck, ...playerState } = globalState.playerState[playerId];
  return {
    ...globalState,
    playerState: {
      ...globalState.playerState,
      [playerId]: {
        ...playerState,
        deck: random.shuffle(deck),
      },
    },
  };
}

export function addToDiscard(gameState: GlobalState, card: Card) {
  return {
    ...gameState,
    playerState: {
      ...gameState.playerState,
      [card.ownerId]: {
        ...gameState.playerState[card.ownerId],
        discard: [...gameState.playerState[card.ownerId].discard, card],
      },
    },
  };
}

export function mill(
  gameState: GlobalState,
  playerId: string,
  count: number = 1,
) {
  const playerState = gameState.playerState[playerId];
  if (playerState.deck.length === 0) {
    return gameState;
  }
  const milledCards = playerState.deck.slice(0, count);
  const remainingDeck = playerState.deck.slice(count);
  return {
    ...gameState,
    playerState: {
      ...gameState.playerState,
      [playerId]: {
        ...playerState,
        deck: remainingDeck,
        discard: [...playerState.discard, ...milledCards],
      },
    },
  };
}
