import { GameRandom } from '@long-game/game-definition';
import {
  Board,
  Card,
  CardStack,
  GlobalState,
  PlayerHiddenState,
} from '../gameDefinition';
import { DeckDefinition, deckDefinitions } from '../definitions/decks';
import { shuffleDeck, draw } from './zone';

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
      const cards: Card[] = [...decklists[member.id].list].map((id) => ({
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
}
