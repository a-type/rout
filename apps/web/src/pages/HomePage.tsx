import { FriendInvites } from '@/components/friendships/FriendInvites.jsx';
import { FriendsList } from '@/components/friendships/FriendsList.jsx';
import { SendInvite } from '@/components/friendships/SendInvite.jsx';
import { CreateGame } from '@/components/games/CreateGame.jsx';
import { MembershipsList } from '@/components/memberships/MembershipsList.jsx';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.jsx';
import { EditProfileButton } from '@/components/users/EditProfile.jsx';
import { PageContent, PageNowPlaying, PageRoot } from '@a-type/ui';

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  return (
    <PageRoot>
      <PageContent>
        <div className="flex flex-row">
          <EditProfileButton />
        </div>
        <SendInvite />
        <FriendInvites />
        <FriendsList />
        <MembershipsList />
        <PageNowPlaying unstyled>
          <CreateGame />
        </PageNowPlaying>
        <CompleteProfileDialog />
      </PageContent>
    </PageRoot>
  );
}

export default HomePage;
