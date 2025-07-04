import { GameRandom } from '@long-game/game-definition';
import { WordItem } from './sequences';
import { freebieWords } from './wordBank';

export function isValidWriteIn(word: string): boolean {
  // Check if the word is a single word without spaces
  return /^\w+$/.test(word);
}

export function isValidFreebie(word: string): boolean {
  return freebieWords.includes(word);
}

export function takeWords({
  wordBank,
  currentIndex = 0,
  count = 5,
  random,
  areNew = true,
}: {
  wordBank: string[];
  currentIndex: number;
  count: number;
  random: GameRandom;
  areNew: boolean;
}): {
  words: WordItem[];
  // if the word bank was fully used, it will be reshuffled
  wordBank: string[];
  currentIndex: number;
} {
  // Take a specified number of words from the word bank starting at the current index, wrapping around if necessary
  const words = [];
  let bank = wordBank;
  let index = currentIndex;
  while (words.length < count) {
    if (index >= wordBank.length) {
      index = 0; // Wrap around to the start of the word bank
      bank = random.shuffle(wordBank); // Reshuffle the word bank when wrapping around
    }
    words.push(wordBank[index]);
    index++;
  }
  return {
    words: words.map((word) => ({
      text: word,
      id: random.id(), // Assign a new ID for each word taken
      isNew: areNew,
      isWriteIn: !word, // if the word is empty, it's a write-in tile
    })),
    wordBank: bank,
    currentIndex: index,
  };
}
