import { GameRandom } from '@long-game/game-definition';
import {
  Card,
  CardStack,
  GlobalState,
  PlayerSelfState,
  ValidCardId,
} from '../gameDefinition';
import { DeckDefinition } from '../definitions/decks';
import { shuffleDeck, draw, addToDeck } from './zone';

export function generateInitialGameState({
  random,
  members,
  decklists,
}: {
  random: GameRandom;
  members: {
    id: string;
  }[];
  decklists: Record<string, DeckDefinition>;
}): GlobalState {
  const playerOrder = random.shuffle(members.map((m) => m.id));
  const cardState: Record<string, Card> = {};
  let state: GlobalState = {
    board: Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => [] as CardStack),
    ),
    cardState,
    playerState: members.reduce((acc, member, idx) => {
      const cards: Card[] = [...decklists[member.id].list].map((id) =>
        generateCard({ cardId: id, random, ownerId: member.id }),
      );
      cards.forEach((card) => (cardState[card.instanceId] = card));
      acc[member.id] = {
        deck: cards.map((c) => c.instanceId),
        hand: [],
        discard: [],
        side: idx === 0 ? 'top' : 'bottom',
      };
      return acc;
    }, {} as Record<string, PlayerSelfState>),
    winner: null,
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
}

export function generateCard({
  cardId,
  random,
  ownerId,
}: {
  cardId: ValidCardId;
  random: GameRandom;
  ownerId: string;
}): Card {
  return {
    cardId,
    instanceId: random.id(),
    ownerId: ownerId,
    fatigued: false,
    continuousEffects: [],
  };
}

export function generateCardInDeck({
  globalState,
  cardId,
  random,
  ownerId,
}: {
  globalState: GlobalState;
  cardId: ValidCardId;
  random: GameRandom;
  ownerId: string;
}): GlobalState {
  const card = {
    cardId,
    instanceId: random.id(),
    ownerId: ownerId,
    fatigued: false,
    continuousEffects: [],
  };
  return addToDeck(globalState, card);
}
