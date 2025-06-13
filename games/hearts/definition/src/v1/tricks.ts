import { PrefixedId } from '@long-game/common';
import { Card, GlobalState } from './gameDefinition';

export function getDealStartCard(playerCount: number): Card {
  if (playerCount === 5) {
    return '3c';
  }
  return '2c';
}

export function getTrickLeader(
  state: Pick<
    GlobalState,
    'currentTrick' | 'hands' | 'lastCompletedTrick' | 'isFirstTrickOfDeal'
  >,
): PrefixedId<'u'> {
  // if a current trick exists, the leader is the first player to play a card
  if (state.currentTrick.length > 0) {
    return state.currentTrick[0].playerId;
  }

  // if we have past tricks, the leader is the winner of the last trick
  if (!state.isFirstTrickOfDeal && state.lastCompletedTrick) {
    return state.lastCompletedTrick.playerId;
  }

  // if no current trick exists, we look for the particular leading card,
  // which varies for 3/4/5 player games

  if (state.isFirstTrickOfDeal) {
    // 5 player variant - 2 of clubs was removed from deck, use 3 instead
    const soughtCard = getDealStartCard(Object.keys(state.hands).length);
    const playerId = Object.entries(state.hands).find(([_, hand]) =>
      hand.includes(soughtCard),
    )?.[0];
    if (!playerId) {
      throw new Error('No player has the 2 of clubs');
    }
    return playerId as PrefixedId<'u'>;
  }

  throw new Error(
    'No current trick and no last completed trick, cannot determine leader',
  );
}

export function getCurrentPlayer(
  state: Pick<
    GlobalState,
    | 'currentTrick'
    | 'hands'
    | 'playerOrder'
    | 'lastCompletedTrick'
    | 'isFirstTrickOfDeal'
  >,
): PrefixedId<'u'> {
  const leader = getTrickLeader(state);
  const trickCardIndex = state.currentTrick.length;
  const indexOfLeader = state.playerOrder.indexOf(leader);
  const currentPlayerIndex =
    (indexOfLeader + trickCardIndex) % state.playerOrder.length;
  return state.playerOrder[currentPlayerIndex];
}
