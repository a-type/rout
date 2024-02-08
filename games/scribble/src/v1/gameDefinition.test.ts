import { GameRound, clone } from '@long-game/common';
import {
  TurnData,
  gameDefinition,
  getPromptSequenceIndexes,
} from './gameDefinition.js';
import { describe, it, expect } from 'vitest';
import { GameRandom, Turn } from '@long-game/game-definition';

describe('scribble game logic helpers', () => {
  describe('prompt sequence indexes', () => {
    it('alternates indexes for 2 players', () => {
      const members = [{ id: '1' }, { id: '2' }];
      const sequenceCount = 6;
      // first round and second round have the same sequence
      // indexes, then they begin alternating.
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 0,
          sequenceCount,
        }),
      ).toEqual({
        toDrawIndex: 0,
        toDescribeIndex: 0,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 0,
          sequenceCount,
        }),
      ).toEqual({
        toDrawIndex: 3,
        toDescribeIndex: 3,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        toDrawIndex: 3,
        toDescribeIndex: 1,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        toDrawIndex: 0,
        toDescribeIndex: 4,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 2,
          sequenceCount,
        }),
      ).toEqual({
        toDrawIndex: 4,
        toDescribeIndex: 2,
      });

      // it jumps back to 0 for describe so we're describing
      // the other player's drawing
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 3,
          sequenceCount,
        }),
      ).toEqual({
        toDrawIndex: 5,
        toDescribeIndex: 0,
      });
    });
  });
});

describe('scribble game definition', () => {
  it('plays 2 players', () => {
    const rounds: GameRound<Turn<TurnData>>[] = [];

    const members = [{ id: '1' }, { id: '2' }];

    const random = new GameRandom('test');

    const initialState = gameDefinition.getInitialGlobalState({
      members,
      random,
    });
    let globalState = clone(initialState);

    expect(globalState).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "sequences": [
          [],
          [],
          [],
          [],
          [],
          [],
        ],
      }
    `);

    // first round: prompts
    let roundIndex = 0;
    let player1State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '1',
      roundIndex,
    });
    let player2State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '2',
      roundIndex,
    });

    expect(player1State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "type": "prompt",
          },
        ],
      }
    `);
    expect(player2State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "type": "prompt",
          },
        ],
      }
    `);

    rounds.push({
      roundIndex,
      turns: [
        {
          createdAt: new Date().toISOString(),
          data: {
            promptResponses: [
              {
                type: 'description',
                value: 'a cat',
              },
            ],
          },
          roundIndex,
          userId: '1',
        },
        {
          createdAt: new Date().toISOString(),
          data: {
            promptResponses: [
              {
                type: 'description',
                value: 'a dog',
              },
            ],
          },
          roundIndex,
          userId: '2',
        },
      ],
    });

    expect(
      gameDefinition.validateTurn({
        playerState: player1State,
        turn: rounds[0].turns[0],
        roundIndex,
        members,
      }),
    ).toBe(undefined);
    expect(
      gameDefinition.validateTurn({
        playerState: player2State,
        turn: rounds[0].turns[1],
        roundIndex,
        members,
      }),
    ).toBe(undefined);

    globalState = gameDefinition.getState({
      initialState: clone(initialState),
      rounds,
      members,
      random,
    });
    expect(globalState).toEqual({
      imageSize: 256,
      sequences: [
        [
          {
            describerId: '1',
            description: 'a cat',
            illustration: '',
            illustratorId: '',
          },
        ],
        [],
        [],
        [
          {
            describerId: '2',
            description: 'a dog',
            illustration: '',
            illustratorId: '',
          },
        ],
        [],
        [],
      ],
    });

    // second round: drawings
    roundIndex = 1;

    player1State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '1',
      roundIndex,
    });
    player2State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '2',
      roundIndex,
    });

    expect(player1State).toEqual({
      imageSize: 256,
      prompts: [
        {
          type: 'prompt',
        },
        {
          description: 'a dog',
          type: 'draw',
          userId: '2',
        },
      ],
    });
    expect(player2State).toEqual({
      imageSize: 256,
      prompts: [
        {
          type: 'prompt',
        },
        {
          description: 'a cat',
          type: 'draw',
          userId: '1',
        },
      ],
    });

    rounds.push({
      roundIndex,
      turns: [
        {
          createdAt: new Date().toISOString(),
          data: {
            promptResponses: [
              {
                type: 'illustration',
                value: 'a drawing of a dog',
              },
              {
                type: 'description',
                value: 'a phone',
              },
            ],
          },
          roundIndex,
          userId: '1',
        },
        {
          createdAt: new Date().toISOString(),
          data: {
            promptResponses: [
              {
                type: 'illustration',
                value: 'a drawing of a cat',
              },
              {
                type: 'description',
                value: 'a book',
              },
            ],
          },
          roundIndex,
          userId: '2',
        },
      ],
    });

    expect(
      gameDefinition.validateTurn({
        playerState: player1State,
        turn: rounds[1].turns[0],
        roundIndex,
        members,
      }),
    ).toBe(undefined);
    expect(
      gameDefinition.validateTurn({
        playerState: player2State,
        turn: rounds[1].turns[1],
        roundIndex,
        members,
      }),
    ).toBe(undefined);

    globalState = gameDefinition.getState({
      initialState: clone(initialState),
      rounds,
      members,
      random,
    });
    expect(globalState).toEqual({
      imageSize: 256,
      sequences: [
        [
          {
            describerId: '1',
            description: 'a cat',
            illustration: 'a drawing of a cat',
            illustratorId: '2',
          },
        ],
        [
          {
            describerId: '1',
            description: 'a phone',
            illustration: '',
            illustratorId: '',
          },
        ],
        [],
        [
          {
            describerId: '2',
            description: 'a dog',
            illustration: 'a drawing of a dog',
            illustratorId: '1',
          },
        ],
        [
          {
            describerId: '2',
            description: 'a book',
            illustration: '',
            illustratorId: '',
          },
        ],
        [],
      ],
    });

    // third round: guess and draw
    roundIndex = 2;

    player1State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '1',
      roundIndex,
    });
    player2State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '2',
      roundIndex,
    });

    expect(player1State).toEqual({
      imageSize: 256,
      prompts: [
        {
          type: 'prompt',
        },
        {
          description: 'a book',
          type: 'draw',
          userId: '2',
        },
      ],
    });
    expect(player2State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "type": "prompt",
          },
          {
            "description": "a phone",
            "type": "draw",
            "userId": "1",
          },
        ],
      }
    `);

    rounds.push({
      roundIndex,
      turns: [
        {
          createdAt: new Date().toISOString(),
          data: {
            promptResponses: [
              {
                type: 'description',
                value: 'a car',
              },
              {
                type: 'illustration',
                value: 'a drawing of a laptop',
              },
            ],
          },
          roundIndex,
          userId: '1',
        },
        {
          createdAt: new Date().toISOString(),
          data: {
            promptResponses: [
              {
                type: 'description',
                value: 'a house',
              },
              {
                type: 'illustration',
                value: 'a drawing of a candy bar',
              },
            ],
          },
          roundIndex,
          userId: '2',
        },
      ],
    });

    expect(
      gameDefinition.validateTurn({
        playerState: player1State,
        turn: rounds[2].turns[0],
        roundIndex,
        members,
      }),
    ).toBe(undefined);
    expect(
      gameDefinition.validateTurn({
        playerState: player2State,
        turn: rounds[2].turns[1],
        roundIndex,
        members,
      }),
    ).toBe(undefined);

    globalState = gameDefinition.getState({
      initialState: clone(initialState),
      rounds,
      members,
      random,
    });
    expect(globalState).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "sequences": [
          [
            {
              "describerId": "1",
              "description": "a cat",
              "illustration": "a drawing of a cat",
              "illustratorId": "2",
            },
          ],
          [
            {
              "describerId": "1",
              "description": "a phone",
              "illustration": "a drawing of a candy bar",
              "illustratorId": "2",
            },
          ],
          [
            {
              "describerId": "1",
              "description": "a car",
              "illustration": "",
              "illustratorId": "",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a dog",
              "illustration": "a drawing of a dog",
              "illustratorId": "1",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a book",
              "illustration": "a drawing of a laptop",
              "illustratorId": "1",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a house",
              "illustration": "",
              "illustratorId": "",
            },
          ],
        ],
      }
    `);

    // fourth round: guess and draw
    roundIndex = 3;

    player1State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '1',
      roundIndex,
    });
    player2State = gameDefinition.getPlayerState({
      globalState,
      members,
      playerId: '2',
      roundIndex,
    });

    expect(player1State).toEqual({
      imageSize: 256,
      prompts: [
        {
          illustration: 'a drawing of a cat',
          type: 'describe',
          userId: '2',
        },
        {
          description: 'a house',
          type: 'draw',
          userId: '2',
        },
      ],
    });

    expect(player2State).toEqual({
      imageSize: 256,
      prompts: [
        {
          illustration: 'a drawing of a dog',
          type: 'describe',
          userId: '1',
        },
        {
          description: 'a car',
          type: 'draw',
          userId: '1',
        },
      ],
    });
  });

  it('plays 3 players', () => {});
});
