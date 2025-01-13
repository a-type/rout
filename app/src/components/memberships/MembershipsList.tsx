import { sdkHooks } from '@/services/publicSdk';
import { Box } from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export function MembershipsList() {
  const { data: memberships } = sdkHooks.useGetGameSessions();

  return (
    <div className="flex flex-col gap-3">
      <h1>Memberships</h1>
      {memberships?.map((i) => (
        <Box key={i.gameSessionId} direction="row" justify="between" asChild>
          <Link to={`/session/${i.gameSessionId}`}>
            <Box>{i.gameSessionId}</Box>
          </Link>
        </Box>
      ))}
    </div>
  );
}
