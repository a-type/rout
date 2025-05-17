import { PrefixedId } from '@long-game/common';
import { GameRandom } from '@long-game/game-definition';
import {
  Card,
  fivePlayerDeck,
  fullDeck,
  threePlayerDeck,
} from './gameDefinition';

export function shuffleHands({
  random,
  members,
}: {
  random: GameRandom;
  members: any[];
}) {
  const deck =
    members.length === 4
      ? fullDeck
      : members.length === 5
      ? fivePlayerDeck
      : threePlayerDeck;
  const shuffledDeck = random.shuffle(deck);
  const handSize = Math.floor(shuffledDeck.length / members.length);
  const hands = members.map((member, index) => ({
    playerId: member.id,
    hand: shuffledDeck.slice(index * handSize, index * handSize + handSize),
  }));
  return hands.reduce(
    (acc, { playerId, hand }) => ({ ...acc, [playerId]: hand }),
    {} as Record<PrefixedId<'u'>, Card[]>,
  );
}
