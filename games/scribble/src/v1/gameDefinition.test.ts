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
      const sequenceCount = 4;
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
        descriptionIndex: 0,
        illustrationIndex: 0,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 0,
          sequenceCount,
        }),
      ).toEqual({
        descriptionIndex: 2,
        illustrationIndex: 2,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        descriptionIndex: 2,
        illustrationIndex: 2,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '2',
          roundIndex: 1,
          sequenceCount,
        }),
      ).toEqual({
        descriptionIndex: 0,
        illustrationIndex: 0,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 2,
          sequenceCount,
        }),
      ).toEqual({
        descriptionIndex: 1,
        illustrationIndex: 0,
      });
      expect(
        getPromptSequenceIndexes({
          members,
          playerId: '1',
          roundIndex: 3,
          sequenceCount,
        }),
      ).toEqual({
        descriptionIndex: 2,
        illustrationIndex: 1,
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
          {
            "type": "prompt",
          },
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
          {
            "type": "prompt",
          },
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
            descriptions: ['a cat', 'a phone', 'a car'],
          },
          roundIndex,
          userId: '1',
        },
        {
          createdAt: new Date().toISOString(),
          data: {
            descriptions: ['a dog', 'a book', 'a house'],
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
    expect(globalState).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "sequences": [
          [
            {
              "describerId": "1",
              "description": "a cat",
              "illustration": "",
              "illustratorId": "",
            },
          ],
          [
            {
              "describerId": "1",
              "description": "a phone",
              "illustration": "",
              "illustratorId": "",
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
              "illustration": "",
              "illustratorId": "",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a book",
              "illustration": "",
              "illustratorId": "",
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

    expect(player1State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "description": "a dog",
            "type": "draw",
            "userId": "2",
          },
          {
            "description": "a book",
            "type": "draw",
            "userId": "2",
          },
          {
            "description": "a house",
            "type": "draw",
            "userId": "2",
          },
        ],
      }
    `);
    expect(player2State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "description": "a cat",
            "type": "draw",
            "userId": "1",
          },
          {
            "description": "a phone",
            "type": "draw",
            "userId": "1",
          },
          {
            "description": "a car",
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
            illustrations: [
              'a drawing of a dog',
              'a drawing of a book',
              'a drawing of a house',
            ],
          },
          roundIndex,
          userId: '1',
        },
        {
          createdAt: new Date().toISOString(),
          data: {
            illustrations: [
              'a drawing of a cat',
              'a drawing of a phone',
              'a drawing of a car',
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
              "illustration": "a drawing of a phone",
              "illustratorId": "2",
            },
          ],
          [
            {
              "describerId": "1",
              "description": "a car",
              "illustration": "a drawing of a car",
              "illustratorId": "2",
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
              "illustration": "a drawing of a book",
              "illustratorId": "1",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a house",
              "illustration": "a drawing of a house",
              "illustratorId": "1",
            },
          ],
        ],
      }
    `);

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

    expect(player1State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "illustration": "a drawing of a cat",
            "type": "describe",
            "userId": "2",
          },
          {
            "description": "a phone",
            "type": "draw",
            "userId": "1",
          },
        ],
      }
    `);
    expect(player2State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "illustration": "a drawing of a dog",
            "type": "describe",
            "userId": "1",
          },
          {
            "description": "a book",
            "type": "draw",
            "userId": "2",
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
            description: 'a lion',
            illustration: 'a drawing of a candy bar',
          },
          roundIndex,
          userId: '1',
        },
        {
          createdAt: new Date().toISOString(),
          data: {
            description: 'a dingo',
            illustration: 'a drawing of a laptop',
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
            {
              "describerId": "1",
              "description": "a lion",
              "illustration": "",
              "illustratorId": "",
            },
          ],
          [
            {
              "describerId": "1",
              "description": "a phone",
              "illustration": "a drawing of a candy bar",
              "illustratorId": "1",
            },
          ],
          [
            {
              "describerId": "1",
              "description": "a car",
              "illustration": "a drawing of a car",
              "illustratorId": "2",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a dog",
              "illustration": "a drawing of a dog",
              "illustratorId": "1",
            },
            {
              "describerId": "2",
              "description": "a dingo",
              "illustration": "",
              "illustratorId": "",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a book",
              "illustration": "a drawing of a laptop",
              "illustratorId": "2",
            },
          ],
          [
            {
              "describerId": "2",
              "description": "a house",
              "illustration": "a drawing of a house",
              "illustratorId": "1",
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

    expect(player1State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "illustration": "a drawing of a candy bar",
            "type": "describe",
            "userId": "1",
          },
          {
            "description": "a car",
            "type": "draw",
            "userId": "1",
          },
        ],
      }
    `);

    expect(player2State).toMatchInlineSnapshot(`
      {
        "imageSize": 256,
        "prompts": [
          {
            "illustration": "a drawing of a laptop",
            "type": "describe",
            "userId": "2",
          },
          {
            "description": "a house",
            "type": "draw",
            "userId": "2",
          },
        ],
      }
    `);
  });
});
