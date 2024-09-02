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
