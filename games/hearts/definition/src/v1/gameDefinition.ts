import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  GameRandom,
  roundFormat,
} from '@long-game/game-definition';

export type Card = `${CardRank}${CardSuit}`;
export const suits = ['h', 'd', 's', 'c'] as const;
export type CardSuit = (typeof suits)[number];
export const ranks = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  'j',
  'k',
  'q',
  'a',
] as const;
export type CardRank = (typeof ranks)[number];
export const fullDeck: Card[] = ranks.flatMap((rank) =>
  suits.map((suit): Card => `${rank}${suit}`),
);
export const threePlayerDeck = fullDeck.filter((c) => c !== '2d');
export const fivePlayerDeck = fullDeck.filter((c) => c !== '2d' && c !== '2c');

export function isCard(card: string): card is Card {
  return fullDeck.includes(card as Card);
}

export function getCardRank(card: Card): number {
  const rank = card.slice(0, -1);
  if (rank === 'j') return 11;
  if (rank === 'q') return 12;
  if (rank === 'k') return 13;
  if (rank === 'a') return 14;
  return parseInt(rank, 10);
}

export function getCardSuit(card: Card): 'h' | 'd' | 's' | 'c' {
  return card.slice(-1) as any;
}

export function isScoringCard(card: Card): boolean {
  return getCardSuit(card) === 'h' || card === 'qs';
}

export function getScore(cards: Card[]): number {
  const total = cards.reduce((score, card) => {
    if (getCardSuit(card) === 'h') {
      return score + 1;
    }
    if (card === 'qs') {
      return score + 13;
    }
    return score;
  }, 0);

  // shoot the moon
  if (total === 26) {
    return -26;
  }
  return total;
}

function shuffleHands({
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
  // 3 player variant - 1 card that's not the 2 of clubs randomly removed
  if (members.length === 3) {
    if (shuffledDeck.at(-1) !== '2c') {
      shuffledDeck.pop();
    } else {
      // arbitrary.
      shuffledDeck.splice(50, 1);
    }
  }
  const handSize = Math.floor(shuffledDeck.length / members.length);
  const hands = members.map((member, index) => ({
    playerId: member.id,
    hand: shuffledDeck.slice(index * handSize, (index + 1) * handSize),
  }));
  return hands.reduce(
    (acc, { playerId, hand }) => ({ ...acc, [playerId]: hand }),
    {} as Record<PrefixedId<'u'>, Card[]>,
  );
}

function findInitialLeadingPlayer(hands: Record<PrefixedId<'u'>, Card[]>) {
  // 5 player variant - 2 of clubs was removed from deck, use 3 instead
  let soughtCard: Card = '2c';
  if (Object.keys(hands).length === 5) {
    soughtCard = '3c';
  }
  const playerId = Object.entries(hands).find(([_, hand]) =>
    hand.includes(soughtCard),
  )?.[0];
  if (!playerId) {
    throw new Error('No player has the 2 of clubs');
  }
  return playerId as PrefixedId<'u'>;
}

function makeEmptyScoredCards(ids: PrefixedId<'u'>[]) {
  return Object.fromEntries(ids.map((id) => [id, [] as Card[]]));
}

// during the current trick it's relevant who played which card
// so we attach that info
type PlayedCard = {
  playerId: PrefixedId<'u'>;
  card: Card;
};

type TakenTrick = {
  playerId: PrefixedId<'u'>;
  cards: Card[];
};

export type GlobalState = {
  hands: Record<PrefixedId<'u'>, Card[]>;
  // only includes cards from this deal
  scoredCards: Record<PrefixedId<'u'>, Card[]>;
  currentTrick: PlayedCard[];
  playerOrder: PrefixedId<'u'>[];
  scores: Record<PrefixedId<'u'>, number>;
  leadPlayerId: PrefixedId<'u'>;
  lastCompletedTrick?: TakenTrick;
};

export type PlayerState = Pick<
  GlobalState,
  | 'scoredCards'
  | 'currentTrick'
  | 'lastCompletedTrick'
  | 'playerOrder'
  | 'leadPlayerId'
  | 'scores'
> & {
  hand: Card[];
};

export type TurnData = {
  card: Card;
};

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 3,
  maximumPlayers: 5,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn, roundIndex, members }) => {
    // return error string if the moves are invalid

    // if this is the very first round:
    // the player with 2 of clubs must play the 2 of clubs
    if (roundIndex === 0) {
      if (playerState.hand.includes('2c')) {
        if (turn.data.card !== '2c') {
          return 'You must play the 2 of clubs to begin the game.';
        }
      } else {
        return `It's not your turn.`;
      }
    } else {
      // if this is not the first round, play proceeds in player order
      // starting from the player who won the last trick
      const playerOrder = playerState.playerOrder;
      const leadPlayerId = playerState.leadPlayerId;
      const startPlayerIndex = playerOrder.indexOf(leadPlayerId);
      const currentPlayerIndex =
        startPlayerIndex + playerState.currentTrick.length;
      const currentPlayerId =
        playerOrder[currentPlayerIndex % playerOrder.length];
      if (currentPlayerId !== turn.playerId) {
        return `It's not your turn.`;
      }
    }

    // card must exist in player's hand
    if (!playerState.hand.includes(turn.data.card)) {
      return 'That card is not in your hand';
    }

    // on the first trick, if a player has no clubs, they cannot
    // play the queen of spades or a heart.
    if (roundIndex < members.length) {
      if (turn.data.card.endsWith('h') || turn.data.card === 'qs') {
        return 'You cannot play a heart or the queen of spades on the first trick.';
      }
    }

    const allScoredCards = Object.values(playerState.scoredCards).flat();
    const isHeartPlayed = allScoredCards.some(
      (card) => getCardSuit(card) === 'h',
    );
    const isQueenOfSpadesPlayed = allScoredCards.some((card) => card === 'qs');

    /// if this is the first card played in the trick:
    if (playerState.currentTrick.length === 0) {
      // the player must play a card from their hand
      // (this is already checked above)

      // hearts may only be led if a heart or qs was played,
      // or if the player has no other cards in their hand
      const canLeadHearts = playerState.hand.every(
        (c) => getCardSuit(c) === 'h' || c === 'qs',
      );
      if (
        getCardSuit(turn.data.card) === 'h' &&
        !canLeadHearts &&
        !isHeartPlayed &&
        !isQueenOfSpadesPlayed
      ) {
        return 'You cannot lead with a heart unless a heart or the queen of spades has already been played.';
      }

      // otherwise any card may be played
    } else {
      // if the trick is already in progress:
      // the player must follow suit if possible
      const leadCard = playerState.currentTrick[0].card;
      const leadSuit = getCardSuit(leadCard);
      const suitsInHand = new Set(
        playerState.hand.map((card) => getCardSuit(card)),
      );
      if (!turn.data.card.endsWith(leadSuit) && suitsInHand.has(leadSuit)) {
        return `You must follow suit. Play a ${leadSuit} card from your hand.`;
      }
      // otherwise any card may be played
    }
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    return {
      ...playerState,
      currentTrick: [
        ...playerState.currentTrick,
        {
          playerId: prospectiveTurn.playerId,
          card: prospectiveTurn.data.card,
        },
      ],
    };
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    if (members.length < 3 || members.length > 5) {
      return {
        hands: {},
        currentTrick: [],
        playerOrder: [],
        scoredCards: {},
        leadPlayerId: members[0].id,
        scores: {},
        lastCompletedTrick: undefined,
      };
    }
    const hands = shuffleHands({ members, random });
    // this is not round play order, but rather just trick play order.
    const shuffledPlayers = random.shuffle(members.map((member) => member.id));
    const globalState: GlobalState = {
      hands,
      // find player with 2 of clubs
      leadPlayerId: findInitialLeadingPlayer(hands),
      currentTrick: [],
      playerOrder: shuffledPlayers,
      scoredCards: makeEmptyScoredCards(shuffledPlayers),
      scores: members.reduce(
        (acc, member) => ({ ...acc, [member.id]: 0 }),
        {} as Record<PrefixedId<'u'>, number>,
      ),
    };
    return globalState;
  },

  getPlayerState: ({ globalState, playerId }) => {
    return {
      playerOrder: globalState.playerOrder,
      currentTrick: globalState.currentTrick,
      hand: globalState.hands[playerId],
      leadPlayerId: globalState.leadPlayerId,
      scoredCards: globalState.scoredCards,
      scores: globalState.scores,
      lastCompletedTrick: globalState.lastCompletedTrick,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    // only 1 turn per round in this game.
    const turn = round.turns[0]!;

    // go ahead and remove the played card from the player's hand
    const playerId = turn.playerId;
    const playerHand = globalState.hands[playerId];
    const cardPlayed = turn.data.card;
    const newPlayerHand = playerHand.filter((card) => card !== cardPlayed);
    let newHands: Record<PrefixedId<'u'>, Card[]> = {
      ...globalState.hands,
      [playerId]: newPlayerHand,
    };

    const currentTrick = globalState.currentTrick;
    const currentTrickWithPlay = [
      ...currentTrick,
      { playerId: turn.playerId, card: turn.data.card },
    ];

    // is the trick complete?
    if (currentTrickWithPlay.length === members.length) {
      // yes, so we need to determine the winner
      const trickSuit = getCardSuit(currentTrick[0].card);
      const candidateCards = currentTrickWithPlay.filter(
        ({ card }) => getCardSuit(card) === trickSuit,
      );
      const winningCard = candidateCards.reduce((prev, curr) => {
        if (getCardRank(curr.card) > getCardRank(prev.card)) {
          return curr;
        }
        return prev;
      });
      const winningPlayerId = winningCard.playerId;
      const winningCards = currentTrickWithPlay.map(({ card }) => card);
      const completedTrick: TakenTrick = {
        playerId: winningPlayerId,
        cards: winningCards,
      };

      // have we played all cards? hands will be empty
      const allCardsPlayed =
        Object.values(newHands).reduce((acc, hand) => acc + hand.length, 0) ===
        0;

      if (allCardsPlayed) {
        // reshuffle and deal again
        const newHands = shuffleHands({ members, random });
        // now it's time to score this deal
        const scores = members.reduce(
          (acc, member) => ({
            ...acc,
            [member.id]:
              acc[member.id] + getScore(globalState.scoredCards[member.id]),
          }),
          {} as Record<PrefixedId<'u'>, number>,
        );

        return {
          currentTrick: [],
          hands: newHands,
          leadPlayerId: findInitialLeadingPlayer(newHands),
          playerOrder: globalState.playerOrder,
          scoredCards: makeEmptyScoredCards(members.map((m) => m.id)),
          scores,
          lastCompletedTrick: completedTrick,
        };
      }

      // otherwise, add scoring cards to the winning player's list
      const newScoredCards = {
        ...globalState.scoredCards,
        [winningPlayerId]: [
          ...globalState.scoredCards[winningPlayerId],
          ...currentTrickWithPlay
            .map(({ card }) => card)
            .filter((c) => getCardSuit(c) === 'h' || c === 'qs'),
        ],
      };

      return {
        ...globalState,
        currentTrick: [],
        lastCompletedTrick: completedTrick,
        hands: newHands,
        scoredCards: newScoredCards,
      };
    } else {
      // no, so we just need to update the current trick
      return {
        ...globalState,
        currentTrick: currentTrickWithPlay,
        hands: newHands,
      };
    }
  },

  getPublicTurn: ({ turn }) => {
    return turn;
  },

  getStatus: ({ globalState, members }) => {
    // calculate all player scores
    const largestPlayerScore = Math.max(...Object.values(globalState.scores));
    if (largestPlayerScore >= 100) {
      // sort by score, lowest wins
      const sortedScores = Object.entries(globalState.scores).sort(
        ([_, scoreA], [__, scoreB]) => {
          if (scoreA < scoreB) {
            return -1;
          }
          if (scoreA > scoreB) {
            return 1;
          }
          return 0;
        },
      );
      const lowestScore = sortedScores[0]![1];
      // multiple people can tie for lowest score
      const winnerIds = new Array<PrefixedId<'u'>>();
      for (const [playerId, score] of sortedScores) {
        if (score === lowestScore) {
          winnerIds.push(playerId as PrefixedId<'u'>);
        }
      }
      return {
        status: 'complete',
        winnerIds,
      };
    }

    return {
      status: 'active',
    };
  },
};
