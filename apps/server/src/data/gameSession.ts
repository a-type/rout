import { Session } from '@a-type/auth';
import { LongGameError } from '@long-game/common';
import { db, PrefixedId } from '@long-game/db';

export async function validateAccessToGameSession(
  gameSessionId: PrefixedId<'gs'>,
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
    .where('userId', '=', session.userId as PrefixedId<'u'>)
    .select(['id'])
    .executeTakeFirstOrThrow(
      () =>
        new LongGameError(
          LongGameError.Code.NotFound,
          'Could not find that game session. Are you logged in?',
        ),
    );
}
