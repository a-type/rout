import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  Card,
  ConfirmedButton,
  Dialog,
  ErrorBoundary,
  FieldLabel,
  FieldRoot,
  Select,
  toast,
} from '@a-type/ui';
import { PrefixedId } from '@long-game/common';
import {
  AdminGameSessionDetails,
  AdminGameSessionSummary,
} from '@long-game/game-client';
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
    <Box col gap>
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
      <PickLeader details={details} />
    </Box>
  );
}

function PickLeader({ details }: { details: AdminGameSessionDetails }) {
  const members = details.members.map((m) => ({
    value: m.id,
    label: m.displayName,
  }));
  const setLeader = sdkHooks.useAdminSetGameSessionLeader();

  return (
    <FieldRoot>
      <FieldLabel htmlFor="leader">Leader</FieldLabel>
      <Select
        id="leader"
        value={details.createdBy ?? null}
        disabled={setLeader.isPending}
        onValueChange={(memberId) => {
          setLeader.mutate({
            sessionId: details.id,
            leaderId: memberId as PrefixedId<'u'>,
          });
        }}
        items={members}
      >
        <Select.Trigger />
        <Select.Content>
          {members.map((m) => (
            <Select.Item key={m.value} value={m.value}>
              {m.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </FieldRoot>
  );
}
