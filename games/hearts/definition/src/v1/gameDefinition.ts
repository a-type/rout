import { isPrefixedId, PrefixedId } from '@long-game/common';
import {
  BaseTurnError,
  GameDefinition,
  SystemChatMessage,
} from '@long-game/game-definition';
import { shuffleHands } from './deck.js';
import { getDraftingRound, getRoundIndex } from './rounds.js';
import {
  getCurrentPlayer,
  getDealStartCard,
  getTrickLeader,
} from './tricks.js';

export type Card = `${CardRank}${CardSuit}`;
export const suits = ['h', 'd', 's', 'c'] as const;
export type CardSuit = (typeof suits)[number];
export const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'j', 'k', 'q', 'a'] as const;
export type CardRank = (typeof ranks)[number];
export const fullDeck: Card[] = ranks.flatMap((rank) =>
  suits.map((suit): Card => `${rank}${suit}`),
);
export const threePlayerDeck = fullDeck.filter((c) => c !== '2d');
export const fivePlayerDeck = fullDeck.filter((c) => c !== '2d' && c !== '2c');
export const scoringCards = fullDeck.filter(
  (card) => getCardSuit(card) === 'h' || card === 'qs',
);
export const shootTheMoonScore = getScore(scoringCards);

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

export function getCardDisplayRank(card: Card): string {
  const rank = card.slice(0, -1);
  return rank.toUpperCase();
}

export function getCardSuit(card: Card): 'h' | 'd' | 's' | 'c' {
  return card.slice(-1) as any;
}

export function getCardDisplaySuit(card: Card): string {
  const suit = getCardSuit(card);
  if (suit === 'h') return 'Hearts';
  if (suit === 'd') return 'Diamonds';
  if (suit === 's') return 'Spades';
  if (suit === 'c') return 'Clubs';
  throw new Error(`Invalid card suit: ${suit}`);
}

export function getCardColor(card: Card): 'red' | 'black' {
  const suit = getCardSuit(card);
  if (suit === 'h' || suit === 'd') {
    return 'red';
  }
  return 'black';
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
  if (total === shootTheMoonScore) {
    return -shootTheMoonScore;
  }
  return total;
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
  cards: PlayedCard[];
};

export type GlobalState = {
  hands: Record<PrefixedId<'u'>, Card[]>;
  // only includes cards from this deal
  scoredCards: Record<PrefixedId<'u'>, Card[]>;
  currentTrick: PlayedCard[];
  playerOrder: PrefixedId<'u'>[];
  scores: Record<PrefixedId<'u'>, number>;
  lastCompletedTrick?: TakenTrick;
  isFirstTrickOfDeal: boolean;
};

export type PlayerState = Pick<
  GlobalState,
  | 'scoredCards'
  | 'currentTrick'
  | 'lastCompletedTrick'
  | 'playerOrder'
  | 'scores'
  | 'isFirstTrickOfDeal'
> & {
  hand: Card[];
  leadPlayerId: PrefixedId<'u'>;
  task: 'play' | 'draft' | null;
};

export type PlayTurnData = { card: Card };
export type PassTurnData = { pass: Card[] };
export type TurnData = PlayTurnData | PassTurnData;

export function isPlayTurn(data: TurnData): data is PlayTurnData {
  return (data as PlayTurnData).card !== undefined;
}
export function isPassTurn(data: TurnData): data is PassTurnData {
  return (data as PassTurnData).pass !== undefined;
}

export const gameDefinition: GameDefinition<{
  GlobalState: GlobalState;
  PlayerState: PlayerState;
  TurnData: TurnData;
  PublicTurnData: TurnData;
  TurnError: BaseTurnError;
}> = {
  version: 'v1.0',
  minimumPlayers: 3,
  maximumPlayers: 5,
  getRoundIndex,
  getRoundLabel: ({ roundIndex, members }) => {
    const draftingRound = getDraftingRound(members.length, roundIndex);
    if (draftingRound.passOffset) {
      return `Round ${roundIndex + 1} (Drafting)`;
    }
    return `Round ${roundIndex + 1}`;
  },
  // run on both client and server

  validateTurn: ({ playerState, turn, roundIndex, members }) => {
    // drafting rounds -- turns are very different (it's a list of cards to pass
    // to another player)
    if (getDraftingRound(members.length, roundIndex).passOffset) {
      if (!isPassTurn(turn.data)) {
        return 'You must pass cards to another player.';
      }
      // all passed cards must be in the player's hand
      const passedCards = turn.data.pass;
      if (passedCards.length !== 3) {
        return `You must pass 3 cards.`;
      }
      if (passedCards.some((card) => !isCard(card))) {
        return `You must pass valid cards.`;
      }
      if (passedCards.some((card) => !playerState.hand.includes(card))) {
        return `You cannot pass cards that are not in your hand.`;
      }
      // all passed cards must be unique
      const uniqueCards = new Set(passedCards);
      if (uniqueCards.size !== passedCards.length) {
        return `You cannot pass duplicate cards.`;
      }

      // that's all for drafting
      return;
    }

    if (!isPlayTurn(turn.data)) {
      return 'You must play a card.';
    }

    // return error string if the moves are invalid

    // if this is the very first round:
    // the player with 2 of clubs must play the 2 of clubs
    if (
      playerState.currentTrick.length === 0 &&
      playerState.isFirstTrickOfDeal
    ) {
      const soughtCard = getDealStartCard(members.length);
      const soughtCardRank = getCardDisplayRank(soughtCard);
      const soughtCardSuit = getCardDisplaySuit(soughtCard);
      if (playerState.hand.includes(soughtCard)) {
        if (turn.data.card !== soughtCard) {
          return `You must play the ${soughtCardRank} of ${soughtCardSuit} to begin the trick.`;
        }
      } else {
        return `The player with the ${soughtCardRank} of ${soughtCardSuit} must begin the trick.`;
      }
    } else {
      // if this is not the first round, play proceeds in player order
      // starting from the player who won the last trick
      // (note: can't use ./tricks#getCurrentPlayer here because
      // player-available state doesn't have required information)
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
    if (playerState.isFirstTrickOfDeal) {
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

  applyProspectiveTurnToPlayerState: ({ playerState, prospectiveTurn }) => {
    const turn = prospectiveTurn.data;
    if (isPassTurn(turn)) {
      playerState.hand = playerState.hand.filter(
        (card) => !turn.pass.includes(card),
      );
    } else {
      playerState.hand = playerState.hand.filter((card) => card !== turn.card);
      playerState.currentTrick.push({
        playerId: prospectiveTurn.playerId,
        card: turn.card,
      });
    }
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
        isFirstTrickOfDeal: true,
      };
    }
    const hands = shuffleHands({ members, random });
    // this is not round play order, but rather just trick play order.
    const shuffledPlayers = random.shuffle(members.map((member) => member.id));
    const globalState: GlobalState = {
      hands,
      currentTrick: [],
      playerOrder: shuffledPlayers,
      scoredCards: makeEmptyScoredCards(shuffledPlayers),
      scores: members.reduce(
        (acc, member) => ({ ...acc, [member.id]: 0 }),
        {} as Record<PrefixedId<'u'>, number>,
      ),
      isFirstTrickOfDeal: true,
    };
    return globalState;
  },

  getPlayerState: ({ globalState, roundIndex, playerId }) => {
    // if this is not a drafting round and we're not the active player,
    // return null for task.
    const task = getDraftingRound(globalState.playerOrder.length, roundIndex)
      .passOffset
      ? 'draft'
      : getCurrentPlayer(globalState) === playerId
        ? 'play'
        : null;
    return {
      playerOrder: globalState.playerOrder,
      currentTrick: globalState.currentTrick,
      hand: globalState.hands[playerId],
      leadPlayerId: getTrickLeader(globalState),
      // players can only see scored cards that have points associated
      scoredCards: Object.fromEntries(
        Object.entries(globalState.scoredCards).map(([id, cards]) => [
          id,
          cards.filter((card) => isScoringCard(card)),
        ]),
      ),
      scores: globalState.scores,
      lastCompletedTrick: globalState.lastCompletedTrick,
      task,
      isFirstTrickOfDeal: globalState.isFirstTrickOfDeal,
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    const draftInfo = getDraftingRound(members.length, round.roundIndex);
    if (draftInfo.isNewDeal && draftInfo.passOffset !== null) {
      // this is a drafting round. for each player, we pass
      // the provided cards to the target player. target player
      // changes based on which draft round this is.

      // which player you pass to is based on the drafting round,
      // player order, and your position in that order.
      for (const turn of round.turns) {
        if (!isPassTurn(turn.data)) {
          throw new Error('Expected pass turn');
        }
        const playerId = turn.playerId;
        const myIndex = globalState.playerOrder.indexOf(playerId);
        const targetPlayerIndex: number =
          (myIndex + draftInfo.passOffset) % members.length;
        const targetPlayerId = globalState.playerOrder[targetPlayerIndex];
        // remove passed cards from my hand
        const passedCards = turn.data.pass;
        const myHand = globalState.hands[playerId];
        // pass the cards to the target player
        globalState.hands[playerId] = myHand.filter(
          (card) => !passedCards.includes(card),
        );
        const targetPlayerHand = globalState.hands[targetPlayerId];
        globalState.hands[targetPlayerId] = [
          ...targetPlayerHand,
          ...passedCards,
        ];
      }
      return;
    }

    // rest of this is play rounds

    // only 1 turn per round in play rounds
    const turn = round.turns[0]!;
    const turnData = turn.data as PlayTurnData;

    // go ahead and remove the played card from the player's hand
    const playerId = turn.playerId;
    const playerHand = globalState.hands[playerId];
    const cardPlayed = turnData.card;
    if (!playerHand.includes(cardPlayed)) {
      throw new Error(
        `Player ${playerId} tried to play a card that was not in their hand: ${cardPlayed}`,
      );
    }
    const newPlayerHand = playerHand.filter((card) => card !== cardPlayed);
    // sanity check
    if (playerHand.length !== newPlayerHand.length + 1) {
      throw new Error(
        `Player ${playerId} played card ${cardPlayed} which must have been in their hand multiple times, because their hand was ${playerHand.length} cards and now is ${newPlayerHand.length} cards.`,
      );
    }
    globalState.hands[playerId] = newPlayerHand;

    const currentTrick = globalState.currentTrick;
    const currentTrickWithPlay = [
      ...currentTrick,
      { playerId: turn.playerId, card: turnData.card },
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
      const winningCards = currentTrickWithPlay;
      const completedTrick: TakenTrick = {
        playerId: winningPlayerId,
        cards: winningCards,
      };

      // have we played all cards? hands will be empty
      const allCardsPlayed =
        Object.values(globalState.hands).reduce(
          (acc, hand) => acc + hand.length,
          0,
        ) === 0;

      if (allCardsPlayed) {
        // reshuffle and deal again
        const newHands = shuffleHands({ members, random });
        // now it's time to score this deal
        for (const member of members) {
          const scoredCards = globalState.scoredCards[member.id];
          const score = getScore(scoredCards);
          globalState.scores[member.id] += score;
        }

        globalState.currentTrick = [];
        globalState.hands = newHands;
        globalState.scoredCards = makeEmptyScoredCards(
          members.map((m) => m.id),
        );
        globalState.lastCompletedTrick = completedTrick;
        globalState.isFirstTrickOfDeal = true;
        return;
      }

      // otherwise, add scoring cards to the winning player's list
      globalState.scoredCards[winningPlayerId].push(
        ...currentTrickWithPlay.map(({ card }) => card),
      );
      globalState.currentTrick = [];
      globalState.lastCompletedTrick = completedTrick;
      globalState.isFirstTrickOfDeal = false;
      return;
    } else {
      // no, so we just need to update the current trick
      globalState.currentTrick.push({
        playerId: turn.playerId,
        card: turnData.card,
      });
      return;
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

  getRoundChangeMessages(data) {
    const messages: SystemChatMessage[] = [];
    if (data.completedRound) {
      // send a message for when hearts is broken
      const heartPlayed = data.completedRound.turns.some(
        (round) =>
          isPlayTurn(round.data) && getCardSuit(round.data.card) === 'h',
      );
      // fixme: should only start from last deal
      const heartPreviouslyPlayed = Object.values(data.globalState.scoredCards)
        .flat()
        .some((card) => getCardSuit(card) === 'h');
      const qsPlayedTurn = data.completedRound.turns.find(
        (round) => isPlayTurn(round.data) && round.data.card === 'qs',
      );

      if (!heartPreviouslyPlayed && heartPlayed) {
        messages.push({
          content: 'Hearts have been broken!',
          metadata: {
            type: 'hearts-broken',
          },
        });
      }
      if (qsPlayedTurn) {
        messages.push({
          content: 'The Queen of Spades has been played!',
          metadata: {
            type: 'qs-played',
            playerId: qsPlayedTurn.playerId,
          },
        });
      }

      const lastTrickHadScoring =
        data.globalState.lastCompletedTrick?.cards.some(({ card }) =>
          isScoringCard(card),
        );
      const currentTrickEmpty = data.globalState.currentTrick.length === 0;
      const playerWithAllScoringCards = Object.entries(
        data.globalState.scoredCards,
      ).find(
        ([_, cards]) =>
          cards.filter(isScoringCard).length === scoringCards.length,
      );
      const playerShotMoon =
        lastTrickHadScoring &&
        currentTrickEmpty &&
        playerWithAllScoringCards?.[0];
      if (playerShotMoon && isPrefixedId(playerShotMoon, 'u')) {
        const indexInOrder =
          data.globalState.playerOrder.indexOf(playerShotMoon);
        messages.push({
          content: `Player ${indexInOrder + 1} has shot the moon!`,
          metadata: {
            type: 'shot-moon',
            playerId: playerWithAllScoringCards[0],
          },
        });
      }
    }

    // for 3 / 5 player games, tell players which cards were removed on the
    // drafting round
    const isDraftingRound = getDraftingRound(
      data.members.length,
      data.roundIndex,
    ).isNewDeal;

    // if this is a new deal, say so
    if (data.globalState.lastCompletedTrick === undefined && isDraftingRound) {
      messages.push({
        content: 'A new deal has started!',
        metadata: {
          type: 'new-deal',
        },
      });
    }

    if (isDraftingRound && data.members.length !== 4) {
      const allCards = new Set(fullDeck);
      for (const hand of Object.values(data.globalState.hands)) {
        for (const card of hand) {
          allCards.delete(card);
        }
      }

      const removedCards = Array.from(allCards);
      const removedCardsString = removedCards
        .map(
          (card) =>
            `${getCardDisplayRank(card)} of ${getCardDisplaySuit(card)}`,
        )
        .join(', ');
      messages.push({
        content: `The following cards were removed from the deck for ${data.members.length} players: ${removedCardsString}`,
        metadata: {
          type: 'removed-cards',
          removedCards,
        },
      });
    }

    return messages;
  },
};
