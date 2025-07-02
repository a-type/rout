import { PrefixedId } from '@long-game/common';

export type StorySequence = StoryStep[];
export type StoryStep = {
  words: WordItem[];
  playerId: PrefixedId<'u'>;
};
export type WordItem = {
  id: string;
  // if text is empty, this is a blank word that
  // the player is allowed to write in.
  text: string;
  // if not present, this was game-generated
  // if present, this player wrote this word in.
  authorId?: string;
  isNew?: boolean; // if true, this word was just drawn by the player
};

export function getPlayerSequenceIndex({
  sequenceCount,
  roundIndex,
  playerIndex,
}: {
  sequenceCount: number;
  roundIndex: number;
  playerIndex: number;
}): number {
  return (playerIndex * 2 + roundIndex * 2) % sequenceCount;
}
