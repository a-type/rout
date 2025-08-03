import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  type BaseTurnError,
} from '@long-game/game-definition';
import { ROUND_COUNT } from './constants.js';
import {
  getPlayerSequenceIndex,
  StorySequence,
  StoryStep,
  WordItem,
} from './sequences.js';
import { wordBank } from './wordBank.js';
import { isValidFreebie, isValidWriteIn, takeWords } from './words.js';

export type GlobalState = {
  wordBank: string[];
  wordBankIndex: number;
  sequences: StorySequence[];
  playerOrder: PrefixedId<'u'>[];
  hands: Record<PrefixedId<'u'>, WordItem[]>;
};

export type PlayerState = {
  hand: WordItem[];
  prompt: StoryStep;
};

export type TurnData = {
  words: WordItem[];
};

// optional: extend the validation error type with your own metadata
export type TurnError = BaseTurnError;

export const gameDefinition: GameDefinition<
  GlobalState,
  PlayerState,
  TurnData,
  {},
  TurnError,
  TurnData
> = {
  version: 'v1.0',
  minimumPlayers: 2,
  maximumPlayers: 10,
  getRoundIndex: roundFormat.sync(),
  // run on both client and server

  validateTurn: ({ playerState, turn }) => {
    // min/max words
    const wordsUsed = turn.data.words.filter(
      (word) => !isValidFreebie(word.text),
    );
    if (wordsUsed.length < 5) {
      return {
        code: 'too-few-words',
        message: 'You must use at least 5 words from your pile.',
      };
    }
    if (wordsUsed.length > 20) {
      return {
        code: 'too-many-words',
        message: 'You can only use up to 20 words from your pile.',
      };
    }
  },
  validatePartialTurn: ({ playerState, turn }) => {
    // all used words must be in player's hand
    const handWords = Object.fromEntries(
      playerState.hand.map((word) => [word.id, word]),
    );
    for (const word of turn.data.words) {
      if (isValidFreebie(word.text)) {
        continue;
      }

      if (!handWords[word.id]) {
        return {
          code: 'invalid-word',
          message: `Word "${word.text}" is not in your pile.`,
          data: { wordId: word.id },
        };
      }

      // words must match unless the original was blank
      if (
        handWords[word.id].text !== word.text &&
        handWords[word.id].text !== ''
      ) {
        return {
          code: 'invalid-word',
          message: `Word "${word.text}" does not match the original word from your pile.`,
          data: { wordId: word.id },
        };
      }
      if (handWords[word.id].isWriteIn) {
        if (!isValidWriteIn(word.text)) {
          return {
            code: 'invalid-write-in',
            message: `Your write-in word "${word.text}" is not a single word.`,
            data: { wordId: word.id },
          };
        }
      }
    }
  },
  getInitialTurn() {
    return { words: [] };
  },

  // run on client

  getProspectivePlayerState: ({ playerState, prospectiveTurn }) => {
    // remove used words from the player's hand
    const newHand = playerState.hand.filter(
      (word) => !prospectiveTurn.data.words.some((w) => w.id === word.id),
    );
    return {
      ...playerState,
      hand: newHand,
    };
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    let gameWordBank = random.shuffle(wordBank);
    let index = 0;
    // ensure each player has a unique set of words
    const hands = {} as Record<PrefixedId<'u'>, WordItem[]>;
    for (const member of members) {
      const { wordBank, words, currentIndex } = takeWords({
        wordBank: gameWordBank,
        currentIndex: index,
        count: 75, // each player gets 75 words
        random,
        areNew: false,
      });
      gameWordBank = wordBank; // update the game word bank
      index = currentIndex; // update the index for the next player
      hands[member.id] = words; // assign the words to the player's hand
      // add 2 blanks for each player
      hands[member.id].push(
        { id: random.id(), text: '', isNew: false, isWriteIn: false },
        { id: random.id(), text: '', isNew: false, isWriteIn: false },
      );
    }

    return {
      sequences: members.map(() => []),
      playerOrder: random.shuffle(members.map((m) => m.id)),
      hands,
      wordBank: gameWordBank,
      wordBankIndex: index, // track the current index in the word bank
    };
  },

  getPlayerState: ({ globalState, playerId, members, roundIndex }) => {
    const index = getPlayerSequenceIndex({
      sequenceCount: globalState.sequences.length,
      roundIndex,
      playerIndex: globalState.playerOrder.indexOf(playerId),
    });
    const seq = globalState.sequences[index];
    console.log('Player state for', playerId, 'at round', roundIndex, seq);
    return {
      prompt: seq[seq.length - 1] || { words: [] },
      hand: globalState.hands[playerId] || [],
    };
  },

  applyRoundToGlobalState: ({ globalState, round, random, members }) => {
    for (const turn of round.turns) {
      const index = getPlayerSequenceIndex({
        sequenceCount: globalState.sequences.length,
        roundIndex: round.roundIndex,
        playerIndex: globalState.playerOrder.indexOf(turn.playerId),
      });
      const hand = globalState.hands[turn.playerId] || [];
      // reset all new flags in hand
      for (const word of hand) {
        word.isNew = false;
      }
      const handMapped = Object.fromEntries(
        hand.map((word) => [word.id, word]),
      );
      const newStep: StoryStep = {
        id: random.id(),
        playerId: turn.playerId,
        words: [],
      };
      for (const word of turn.data.words) {
        // attach author for written in words
        if (handMapped[word.id]?.text === '') {
          word.authorId = turn.playerId;
        }
        // remove word from hand
        const wordIndex = hand.findIndex((w) => w.id === word.id);
        if (wordIndex !== -1) {
          hand.splice(wordIndex, 1);
        }
        // rewrite freebie ids as they are defined by the client arbitrarily
        if (isValidFreebie(word.text)) {
          word.id = random.id();
        }
        // reset new
        word.isNew = false;
        // add word to step
        newStep.words.push(word);
      }
      globalState.sequences[index].push(newStep);
      globalState.hands[turn.playerId] = hand;
    }

    // add new words to each player's hand
    for (const turn of round.turns) {
      const hand = globalState.hands[turn.playerId] || [];
      // only replace non-freebie used words
      const replaceCount = Math.max(
        5,
        turn.data.words.filter((w) => !isValidFreebie(w.text)).length,
      );
      const {
        wordBank,
        words: newWords,
        currentIndex,
      } = takeWords({
        wordBank: globalState.wordBank,
        currentIndex: globalState.wordBankIndex,
        count: replaceCount,
        random,
        areNew: true, // all new words are new
      });
      globalState.wordBank = wordBank; // update the global word bank
      globalState.wordBankIndex = currentIndex; // update the index for the next player
      // add new words to the player's hand
      globalState.hands[turn.playerId] = [...hand, ...newWords];
    }

    return globalState;
  },

  getPublicTurn: ({ turn }) => {
    return { ...turn, data: {} };
  },

  getStatus: ({ globalState, rounds, members }) => {
    if (rounds.length >= ROUND_COUNT) {
      const thisRound = rounds[rounds.length - 1];
      if (thisRound.turns.length >= members.length) {
        return {
          status: 'complete',
          winnerIds: [],
        };
      }
    }

    return {
      status: 'active',
    };
  },
};
