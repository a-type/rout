import { Session } from '@a-type/auth';
import { LongGameError } from '@long-game/common';
import { db } from '@long-game/db';

export async function getAuthorizedGameSession(
  gameSessionId: string,
  userId: string,
) {
  const gameSession = await db
    .selectFrom('GameSession')
    .innerJoin(
      'GameSessionMembership',
      'GameSession.id',
      'GameSessionMembership.gameSessionId',
    )
    .where('GameSession.id', '=', gameSessionId)
    .where('GameSessionMembership.userId', '=', userId)
    .select([
      'GameSession.id',
      'GameSession.timezone',
      'GameSession.initialState',
      'GameSession.gameId',
      'GameSession.randomSeed',
      'GameSession.gameVersion',
      'GameSession.startedAt',
    ])
    .executeTakeFirst();

  if (!gameSession) {
    return null;
  }

  return gameSession;
}

export async function validateAccessToGameSession(
  gameSessionId: string,
  session: Session | null,
) {
  if (!session) {
    throw new LongGameError(
      LongGameError.Code.Unauthorized,
      'You must be logged in to access game sessions',
    );
  }
  await db
    .selectFrom('GameSessionMembership')
    .where('gameSessionId', '=', gameSessionId)
    .where('userId', '=', session.userId)
    .select(['id'])
    .executeTakeFirstOrThrow(
      () =>
        new LongGameError(
          LongGameError.Code.NotFound,
          'Could not find that game session. Are you logged in?',
        ),
    );
}
