import { FriendInvites } from '@/components/friendships/FriendInvites';
import { FriendsList } from '@/components/friendships/FriendsList';
import { SendInvite } from '@/components/friendships/SendInvite';
import { MainNav } from '@/components/nav/MainNav';
import { PageContent, PageNav, PageRoot } from '@a-type/ui';

export interface FriendsPageProps {}

export function FriendsPage({}: FriendsPageProps) {
  return (
    <PageRoot>
      <PageContent
        innerProps={{
          className: 'gap-lg',
        }}
      >
        <FriendInvites />
        <SendInvite />
        <FriendsList />
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default FriendsPage;
