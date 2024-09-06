import { LongGameError } from '@long-game/common';
import { GQLContext } from './context.js';
import DataLoader from 'dataloader';
import {
  GameSession as DBGameSession,
  GameSession,
  isPrefixedId,
  PrefixedId,
} from '@long-game/db';
import { decodeGameSessionStateId } from './schema/gameSessionState.js';
import { GameSessionState } from '@long-game/game-state';
import { assignTypeName } from './relay.js';
import games from '@long-game/games';

export function keyIndexes(ids: readonly string[]) {
  return Object.fromEntries(ids.map((id, index) => [id, index]));
}

export function createResults<T>(ids: readonly string[], defaultValue?: T) {
  return new Array<T | Error>(ids.length).fill(
    defaultValue ?? new LongGameError(LongGameError.Code.NotFound),
  );
}

export function createDataLoaders(ctx: Pick<GQLContext, 'db' | 'session'>) {
  const gameSessionLoader = new DataLoader<string, GameSession>(async (ids) => {
    if (!ctx.session) {
      // can't view sessions without logging in
      return createResults(ids);
    }
    // join GameSession->Profile to check ownership
    // before allowing access
    const gameSessions = await ctx.db
      .selectFrom('GameSession')
      .where(
        'GameSession.id',
        'in',
        ids.filter((v) => isPrefixedId(v, 'gs')),
      )
      .innerJoin(
        'GameSessionMembership',
        'GameSession.id',
        'GameSessionMembership.gameSessionId',
      )
      .where('GameSessionMembership.userId', '=', ctx.session.userId)
      .selectAll('GameSession')
      .execute();

    const indexes = keyIndexes(ids);

    const results = createResults<
      DBGameSession & { __typename: 'GameSession' }
    >(ids);
    for (const gameSession of gameSessions) {
      results[indexes[gameSession.id]] =
        assignTypeName('GameSession')(gameSession);
    }

    return results;
  });

  const gameSessionStateLoader = new DataLoader<string, GameSessionState>(
    async (ids) => {
      const gameSessions = await gameSessionLoader.loadMany(
        ids.map((v) => v.replace('gss-', 'gs-')),
      );
      const computed = await Promise.allSettled(
        gameSessions.map((session) => {
          if (session instanceof Error) {
            throw session;
          }
          return getGameState(session, ctx);
        }),
      );

      const indexes = keyIndexes(ids);
      const results = createResults<GameSessionState>(ids);
      for (const [index, result] of computed.entries()) {
        if (result.status === 'fulfilled') {
          if (!result.value) {
            results[indexes[ids[index]]] = new LongGameError(
              LongGameError.Code.NotFound,
            );
          } else {
            results[indexes[ids[index]]] = result.value;
          }
        } else {
          results[indexes[ids[index]]] = result.reason;
        }
      }

      return results;
    },
  );

  return {
    gameSession: gameSessionLoader,
    gameSessionState: gameSessionStateLoader,
  };
}

async function getGameState(
  gameSession: DBGameSession,
  ctx: Pick<GQLContext, 'db'>,
) {
  const turns = await ctx.db
    .selectFrom('GameTurn')
    .where('gameSessionId', '=', gameSession.id)
    .select(['data', 'userId', 'createdAt', 'roundIndex'])
    .orderBy('createdAt', 'asc')
    .execute();
  const members = await ctx.db
    .selectFrom('GameSessionMembership')
    .where('gameSessionId', '=', gameSession.id)
    .select(['userId as id'])
    .execute();

  const game = games[gameSession.gameId];
  if (!game) {
    throw new Error('Game not found');
  }

  const gameDefinition = game.versions.find(
    (g) => g.version === gameSession.gameVersion,
  );

  if (!gameDefinition) {
    throw new Error(
      `No game rules found for version ${gameSession.gameVersion} of game ${gameSession.gameId}`,
    );
  }

  return new GameSessionState(gameSession, gameDefinition, turns, members);
}
