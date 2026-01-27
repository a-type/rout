import { sdkHooks } from '@/services/publicSdk';
import { Button, Card, ConfirmedButton } from '@a-type/ui';
import { AdminGameSessionSummary } from '@long-game/game-client';
import { GameSessionStatusChip } from '../memberships/GameSessionStatusChip.js';

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
  const dump = sdkHooks.useAdminDumpGameSessionDb();
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
            color="attention"
            emphasis="primary"
            confirmText="Sure?"
            size="small"
            onConfirm={() => deleteSession.mutate({ id: session.id })}
          >
            Delete
          </ConfirmedButton>
          <Button
            size="small"
            onClick={async () => {
              const result = await dump.mutateAsync({ id: session.id });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(
                new Blob([JSON.stringify(result)], {
                  type: 'application/json',
                }),
              );
              link.download = `${session.id}.json`;
              link.click();
              URL.revokeObjectURL(link.href);
              link.remove();
            }}
          >
            Dump
          </Button>
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
}
