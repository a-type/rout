import { sdkHooks } from '@/services/publicSdk';
import { Card, ConfirmedButton } from '@a-type/ui';
import { AdminGameSessionSummary } from '@long-game/game-client';
import { GameSessionStatusChip } from '../memberships/GameSessionStatusChip';

export interface AdminListGameSessionsProps {}

export function AdminListGameSessions({}: AdminListGameSessionsProps) {
  const { data: sessions } = sdkHooks.useAdminGetAllGameSessions({});

  return (
    <Card.Grid>
      {sessions.results.map((session) => (
        <GameSessionCard key={session.id} session={session} />
      ))}
    </Card.Grid>
  );
}

function GameSessionCard({ session }: { session: AdminGameSessionSummary }) {
  const deleteSession = sdkHooks.useAdminDeleteGameSession();
  return (
    <Card>
      <Card.Main>
        <Card.Content>{session.id}</Card.Content>
        <Card.Content>{session.gameId}</Card.Content>
        <Card.Content>
          <GameSessionStatusChip status={session.status} />
        </Card.Content>
        <Card.Content>{session.createdAt.toString()}</Card.Content>
      </Card.Main>
      <Card.Footer>
        <Card.Actions>
          <ConfirmedButton
            color="destructive"
            confirmText="Sure?"
            onConfirm={() => deleteSession.mutate({ id: session.id })}
          >
            Delete
          </ConfirmedButton>
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
}
