import { PrefixedId } from '@long-game/common';
import {
  GameDefinition,
  roundFormat,
  type BaseTurnError,
} from '@long-game/game-definition';
import {
  getPlayerSequenceIndex,
  StorySequence,
  StoryStep,
  WordItem,
} from './sequences';
import { wordBank } from './wordBank';
import { isValidWriteIn } from './words';

export type GlobalState = {
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
    if (turn.data.words.length < 5) {
      return {
        code: 'too-few-words',
        message: 'You must use at least 5 words from your pile.',
      };
    }
    if (turn.data.words.length > 20) {
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
    return playerState;
  },

  // run on server

  getInitialGlobalState: ({ members, random }) => {
    return {
      sequences: members.map(() => []),
      playerOrder: random.shuffle(members.map((m) => m.id)),
      hands: Object.fromEntries(
        members.map((member) => [
          member.id,
          random
            .shuffle(wordBank)
            .slice(0, 75)
            .map((word) => ({
              id: random.id(),
              text: word,
              isWriteIn: !word, // if the word is empty, it's a write-in tile
            })),
        ]),
      ),
    };
  },

  getPlayerState: ({ globalState, playerId, members, roundIndex }) => {
    const index = getPlayerSequenceIndex({
      sequenceCount: globalState.sequences.length,
      roundIndex,
      playerIndex: globalState.playerOrder.indexOf(playerId),
    });
    const seq = globalState.sequences[index];
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
      const replaceCount = Math.max(5, turn.data.words.length);
      const newWords = random
        .shuffle(wordBank)
        .slice(0, replaceCount)
        .map((word) => ({
          id: random.id(),
          text: word,
          isNew: true,
          isWriteIn: !word,
        }));
      globalState.hands[turn.playerId] = [...hand, ...newWords];
    }

    return globalState;
  },

  getPublicTurn: ({ turn }) => {
    return { ...turn, data: {} };
  },

  getStatus: ({ globalState, rounds }) => {
    // TODO: when is the game over? who won?
    return {
      status: 'active',
    };
  },
};
