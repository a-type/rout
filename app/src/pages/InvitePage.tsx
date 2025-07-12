import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, H1, Icon, P, PageContent, PageRoot } from '@a-type/ui';
import { APP_NAME } from '@long-game/common';
import { FriendshipInvitationPublicInfo, Self } from '@long-game/game-client';
import { Link, useParams } from '@verdant-web/react-router';

const InvitePage = () => {
  const { inviteId: id } = useParams();
  const { data: me } = sdkHooks.useGetMe();
  const { data: invite } = sdkHooks.useGetPublicFriendshipInvite({ id });

  return (
    <PageRoot>
      <PageContent>
        <Box layout="center center" full>
          {me ? (
            <LoggedInInvite me={me} invite={invite} />
          ) : (
            <LoggedOutInvite invite={invite} />
          )}
        </Box>
      </PageContent>
    </PageRoot>
  );
};

export default InvitePage;

function LoggedInInvite({
  me,
  invite,
}: {
  me: Self;
  invite: FriendshipInvitationPublicInfo;
}) {
  // logged in users -- make sure the invite matches the user
  const respondMutation = sdkHooks.useRespondToFriendshipInvite();

  return (
    <Box direction="col">
      <H1>Become friends with {invite.inviterDisplayName}</H1>
      <P>
        {invite.inviterDisplayName} has invited you to be friends on {APP_NAME}!
      </P>
      <Box>
        <Button
          color="ghostDestructive"
          onClick={() => {
            respondMutation.mutate({ response: 'declined', id: invite.id });
          }}
        >
          Decline
        </Button>
        <Button
          onClick={() => {
            respondMutation.mutate({ response: 'accepted', id: invite.id });
          }}
        >
          Accept
        </Button>
      </Box>
    </Box>
  );
}

function LoggedOutInvite({
  invite,
}: {
  invite: FriendshipInvitationPublicInfo;
}) {
  // instruct users on signing up
  return (
    <Box direction="col" items="start">
      <H1>
        Join {invite.inviterDisplayName} on {APP_NAME}
      </H1>
      <P>
        Let the games begin! Create an account to start your ritual of play
        together.
      </P>
      <Button asChild>
        <Link to="/login?tab=signup">Sign Up</Link>
      </Button>
      <Box className="color-gray-dark">
        Have an account already?{' '}
        <Button asChild className="inline-flex" size="small" color="ghost">
          <Link to="/login">
            Log in <Icon name="arrowRight" />
          </Link>
        </Button>
        .
      </Box>
    </Box>
  );
}
