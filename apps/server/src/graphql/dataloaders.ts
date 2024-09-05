import { LongGameError } from '@long-game/common';
import { GQLContext } from './context.js';
import DataLoader from 'dataloader';
import { GameSession as DBGameSession } from '@long-game/db';
import { decodeGameSessionStateId } from './schema/gameSessionState.js';
import { getGameState } from '@long-game/game-state';
import { GameSessionState } from '@long-game/game-state';
import { assignTypeName } from './relay.js';

export function keyIndexes(ids: readonly string[]) {
  return Object.fromEntries(ids.map((id, index) => [id, index]));
}

export function createResults<T>(ids: readonly string[], defaultValue?: T) {
  return new Array<T | Error>(ids.length).fill(
    defaultValue ?? new LongGameError(LongGameError.Code.NotFound),
  );
}

export function createDataLoaders(ctx: Pick<GQLContext, 'db' | 'session'>) {
  const gameSessionLoader = new DataLoader(async (ids: readonly string[]) => {
    if (!ctx.session) {
      // can't view sessions without logging in
      return createResults(ids);
    }
    // join GameSession->Profile to check ownership
    // before allowing access
    const gameSessions = await ctx.db
      .selectFrom('GameSession')
      .where('GameSession.id', 'in', ids)
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

  const gameSessionStateLoader = new DataLoader<
    string,
    GameSessionState & { id: string }
  >(async (ids) => {
    const gameSessions = await gameSessionLoader.loadMany(
      ids.map(decodeGameSessionStateId),
    );
    const computed = await Promise.allSettled(
      gameSessions.map((session) => {
        if (session instanceof Error) {
          throw session;
        }
        return getGameState(session);
      }),
    );

    const indexes = keyIndexes(ids);
    const results = createResults<GameSessionState & { id: string }>(ids);
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
  });

  return {
    gameSession: gameSessionLoader,
    gameSessionState: gameSessionStateLoader,
  };
}
