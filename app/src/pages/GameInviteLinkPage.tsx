import { MainNav } from '@/components/nav/MainNav';
import { EditProfileForm } from '@/components/users/EditProfile';
import { UserAvatar } from '@/components/users/UserAvatar';
import { useGame } from '@/hooks/useGame';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, P, PageContent, PageRoot, toast } from '@a-type/ui';
import { TopographyBackground, Wordmark } from '@long-game/game-ui';
import { Link, useNavigate, useParams } from '@verdant-web/react-router';

const GameInviteLinkPage = () => {
  const { code } = useParams<{ code: string }>();
  if (!code) {
    throw new Error('No code provided');
  }
  const { data: me } = sdkHooks.useGetMe();

  const { data: publicInviteData } =
    sdkHooks.useGetPublicGameSessionFromInviteCode(code);

  const game = useGame(publicInviteData.gameId || 'empty');

  const navigate = useNavigate();
  const claimMutation = sdkHooks.useClaimPublicGameSessionLink();
  async function claim() {
    await claimMutation.mutateAsync({ code });
    toast("You're in!");
    navigate(`/session/${publicInviteData.gameSessionId}`);
  }

  if (!me) {
    // to new user flow, then return here.
    return (
      <PageRoot>
        <TopographyBackground className="fixed" />
        <PageContent>
          <Box col gap layout="center center" full grow>
            <Wordmark />
            <P style={{ textAlign: 'center' }}>
              You've been invited to join a game
              {game?.title ? ` of ${game.title}` : ''} on Rout!
            </P>
            <P style={{ textAlign: 'center' }}>
              Before we get started, you need to log in or create a profile.
            </P>
            <Button
              emphasis="primary"
              render={
                <Link
                  to={`/login?tab=signup&returnTo=${location.href}`}
                  preserveQuery
                />
              }
            >
              Get started
            </Button>
          </Box>
        </PageContent>
      </PageRoot>
    );
  }

  const incompleteProfile = !me.displayName || !me.color;

  return (
    <PageRoot>
      <TopographyBackground />
      <PageContent>
        <MainNav />
        <Box col gap layout="center center" full grow>
          <UserAvatar
            userId={me.id}
            style={{
              aspectRatio: '1 / 1',
              width: '20vmin',
            }}
          />
          {me.displayName && (
            <P bold emphasis="primary">
              Hey {me.displayName}!
            </P>
          )}
          <P style={{ textAlign: 'center' }}>
            You've been invited to join a game
            {game?.title ? ` of ${game.title}` : ''} on Rout!
          </P>
          {incompleteProfile ? (
            <Box col gap surface p>
              <P style={{ textAlign: 'center' }}>
                Before we get started, let's complete your profile.
              </P>
              <EditProfileForm />
            </Box>
          ) : (
            <Button
              emphasis="primary"
              onClick={claim}
              loading={claimMutation.isPending}
            >
              Join game
            </Button>
          )}
        </Box>
      </PageContent>
    </PageRoot>
  );
};

export default GameInviteLinkPage;
