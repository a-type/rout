import { zValidator } from '@hono/zod-validator';
import {
  assert,
  idShapes,
  PrefixedId,
  Turn,
  turnShape,
} from '@long-game/common';
import {
  GameDefinition,
  GameMember,
  GameModule,
  GameStateCache,
  StateCheckpoint,
} from '@long-game/game-definition';
import { Hono } from 'hono';
import { z } from 'zod';

// TODO: make caching backed by KV... this will just get thrown away.
function initializeStateCache(
  definition: GameDefinition,
  details: {
    sessionId: PrefixedId<'gs'>;
    randomSeed: string;
    members: GameMember[];
    setupData: any;
  },
) {
  return new GameStateCache(definition, details);
}

export function createGameApi(
  manifest: GameModule,
  definition: GameDefinition,
) {
  const app = new Hono()
    .get('/api/details', (ctx) => {
      return ctx.json({
        ...manifest,
        maximumPlayers: definition.maximumPlayers,
        minimumPlayers: definition.minimumPlayers,
        hasRoundChangeMessages: !!definition.getRoundChangeMessages,
        hasPartialTurnValidation: !!definition.validatePartialTurn,
        hasSetupData: !!definition.getSetupData,
      });
    })
    .post(
      '/api/generateSetupData',
      zValidator(
        'json',
        z.object({
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
        }),
      ),
      async (ctx) => {
        // v8 ignore if -- @preserve
        if (!definition.getSetupData) {
          return ctx.json(null);
        }

        const { members } = ctx.req.valid('json');
        assert(members.length > 0, 'At least one member is required');
        const setupData = await definition.getSetupData({
          members,
        });
        return ctx.json(setupData);
      },
    )
    .post(
      '/api/computeGlobalState',
      zValidator(
        'json',
        z.object({
          sessionId: idShapes.GameSession,
          randomSeed: z.string(),
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
          setupData: z.unknown(),
          rounds: z.array(
            z.object({
              roundIndex: z.number(),
              turns: z.array(turnShape()),
            }),
          ),
          checkpoint: z
            .object({
              state: z.unknown(),
              randomState: z.any(),
              roundIndex: z.number(),
              turnCount: z.number(),
            })
            .optional()
            .nullable(),
        }),
      ),
      async (ctx) => {
        const {
          randomSeed,
          members,
          setupData,
          rounds,
          sessionId,
          checkpoint,
        } = ctx.req.valid('json');
        assert(!!setupData, 'setupData is required');
        assert(members.length > 0, 'At least one member is required');
        const stateCache = initializeStateCache(definition, {
          sessionId,
          members,
          randomSeed,
          setupData,
        });
        if (checkpoint) {
          assert(
            checkpoint.state !== undefined,
            'checkpoint.state is required',
          );
          assert(
            checkpoint.randomState !== undefined,
            'checkpoint.randomState is required',
          );
          stateCache.preload({
            state: checkpoint.state,
            randomState: checkpoint.randomState,
            roundIndex: checkpoint.roundIndex,
            turnCount: checkpoint.turnCount,
          });
        }
        const state = stateCache.getState(rounds);
        return ctx.json(state as StateCheckpoint<any>);
      },
    )
    .post(
      '/api/computePlayerState',
      zValidator(
        'json',
        z.object({
          playerId: idShapes.User,
          globalState: z.unknown(),
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
          rounds: z.array(
            z.object({
              roundIndex: z.number(),
              turns: z.array(turnShape()),
            }),
          ),
          playerTurn: turnShape().nullable(),
        }),
      ),
      async (ctx) => {
        const { playerId, globalState, playerTurn, rounds, members } =
          ctx.req.valid('json');
        const playerState = definition.getPlayerState({
          playerId,
          globalState,
          roundIndex: rounds.length - 1,
          members,
          rounds,
          playerTurn,
        });
        return ctx.json(playerState);
      },
    )
    .post(
      '/api/computePublicTurns',
      zValidator(
        'json',
        z.object({
          turns: z.array(turnShape()),
          globalState: z.unknown(),
        }),
      ),
      async (ctx) => {
        const { turns, globalState } = ctx.req.valid('json');
        const publicTurns = turns.reduce(
          (publicTurnsAcc, turn) => {
            publicTurnsAcc[turn.playerId] = {
              ...turn,
              data: definition.getPublicTurn({
                turn,
                globalState,
                viewerId: turn.playerId,
              }),
            };
            return publicTurnsAcc;
          },
          {} as Record<PrefixedId<'u'>, Turn<any>>,
        );
        return ctx.json(publicTurns);
      },
    )
    .post(
      '/api/validateTurn',
      zValidator(
        'json',
        z.object({
          turn: turnShape().omit({ createdAt: true }),
          playerState: z.unknown(),
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
        }),
      ),
      (ctx) => {
        const { turn, playerState, members } = ctx.req.valid('json');
        const params = {
          turn,
          playerState,
          roundIndex: turn.roundIndex,
          members,
        };
        // validate partial first, then full.
        const validationResult =
          definition.validatePartialTurn?.(params) ||
          definition.validateTurn(params);
        const errorMessage =
          typeof validationResult === 'string'
            ? validationResult
            : validationResult?.message;
        return ctx.json({
          valid: !validationResult,
          message: errorMessage ?? null,
        });
      },
    )
    .post(
      '/api/computeStatus',
      zValidator(
        'json',
        z.object({
          globalState: z.unknown(),
          rounds: z.array(
            z.object({
              roundIndex: z.number(),
              turns: z.array(turnShape()),
            }),
          ),
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
        }),
      ),
      (ctx) => {
        const { globalState, rounds, members } = ctx.req.valid('json');
        const status = definition.getStatus({
          globalState,
          rounds,
          members,
        });
        return ctx.json(status);
      },
    )
    .post(
      '/api/computeRoundIndex',
      zValidator(
        'json',
        z.object({
          globalState: z.unknown(),
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
          startedAt: z.string().transform((str) => new Date(str)),
          gameTimeZone: z.string(),
          environment: z.enum(['development', 'production']),
          turns: z.array(turnShape()),
          currentTime: z.string().transform((str) => new Date(str)),
        }),
      ),
      (ctx) => {
        const {
          globalState,
          members,
          startedAt,
          gameTimeZone,
          environment,
          turns,
          currentTime,
        } = ctx.req.valid('json');
        const roundIndex = definition.getRoundIndex({
          globalState,
          members,
          currentTime,
          startedAt,
          gameTimeZone,
          environment,
          turns,
        });
        return ctx.json(roundIndex);
      },
    )
    .post(
      '/api/computeRoundChangeMessages',
      zValidator(
        'json',
        z.object({
          globalState: z.unknown(),
          members: z.array(
            z.object({
              id: idShapes.User,
              displayName: z.string(),
              color: z.string(),
            }),
          ),
          rounds: z.array(
            z.object({
              roundIndex: z.number(),
              turns: z.array(turnShape()),
            }),
          ),
          roundIndex: z.number(),
        }),
      ),
      (ctx) => {
        const { globalState, members, rounds, roundIndex } =
          ctx.req.valid('json');

        // v8 ignore if -- @preserve
        if (!definition.getRoundChangeMessages) {
          return ctx.json([]);
        }

        const roundChangeMessages = definition.getRoundChangeMessages?.({
          globalState,
          roundIndex,
          members,
          rounds,
          newRound: rounds[roundIndex],
          completedRound: roundIndex > 0 ? rounds[roundIndex - 1] : null,
        });
        return ctx.json(roundChangeMessages);
      },
    );

  return app;
}

export type AppType = ReturnType<typeof createGameApi>;
