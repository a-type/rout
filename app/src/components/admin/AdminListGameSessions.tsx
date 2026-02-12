import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  Card,
  ConfirmedButton,
  Dialog,
  ErrorBoundary,
  toast,
} from '@a-type/ui';
import { AdminGameSessionSummary } from '@long-game/game-client';
import { useState } from 'react';
import { TimezoneField } from '../general/TimeZoneField.js';
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

  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card>
        <Card.Main render={<Dialog.Trigger render={<button />} />}>
          <Card.Content>{session.id}</Card.Content>
          <Card.Content>{session.gameId}</Card.Content>
          <Card.Content unstyled>
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
      <Dialog.Content>
        <Dialog.Title>Edit Game Session {session.id}</Dialog.Title>
        <ErrorBoundary>
          {open && <EditGameSession session={session} />}
        </ErrorBoundary>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog>
  );
}

function EditGameSession({ session }: { session: AdminGameSessionSummary }) {
  const editSession = sdkHooks.useAdminUpdateGameSessionTimezone();
  const { data: details } = sdkHooks.useAdminGetGameSessionDetails({
    id: session.id,
  });

  return (
    <Box>
      <TimezoneField
        value={details.timezone}
        onValueChange={async (value) => {
          await editSession.mutateAsync({
            id: session.id,
            timezone: value,
          });
          toast.success('Timezone updated');
        }}
      />
    </Box>
  );
}
