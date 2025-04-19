import { Wordmark } from '@/components/brand/Wordmark';
import { EditProfileForm } from '@/components/users/EditProfile';
import { UserAvatar } from '@/components/users/UserAvatar';
import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, P, PageContent, PageRoot, toast } from '@a-type/ui';
import { TopographyBackground } from '@long-game/game-ui';
import games from '@long-game/games';
import { Link, useNavigate, useParams } from '@verdant-web/react-router';

const GameInviteLinkPage = () => {
  const { code } = useParams<{ code: string }>();
  if (!code) {
    throw new Error('No code provided');
  }
  const { data: me } = sdkHooks.useGetMe();

  const { data: publicInviteData } =
    sdkHooks.useGetPublicGameSessionFromInviteCode(code);

  const game = games[publicInviteData.gameId];

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
        <TopographyBackground />
        <PageContent>
          <Box d="col" gap layout="center center" full>
            <Wordmark />
            <P className="text-center">
              You've been invited to join a game
              {game?.title ? ` of ${game.title}` : ''} on Rout!
            </P>
            <P className="text-center">
              Before we get started, you need to log in or create a profile.
            </P>
            <Button color="primary" asChild>
              <Link to={`/login?returnTo=${location.href}`} preserveQuery>
                Get started
              </Link>
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
        <Box d="col" gap layout="center center" full>
          <UserAvatar userId={me.id} className="aspect-1 w-20vmin" />
          {me.displayName && (
            <P className="font-bold text-lg">Hey {me.displayName}!</P>
          )}
          <P className="text-center">
            You've been invited to join a game
            {game?.title ? ` of ${game.title}` : ''} on Rout!
          </P>
          {incompleteProfile ? (
            <Box d="col" gap surface p>
              <P className="text-center">
                Before we get started, let's complete your profile.
              </P>
              <EditProfileForm />
            </Box>
          ) : (
            <Button
              color="primary"
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
