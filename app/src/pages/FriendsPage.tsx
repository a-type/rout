import { FriendInvites } from '@/components/friendships/FriendInvites';
import { FriendsList } from '@/components/friendships/FriendsList';
import { SendInvite } from '@/components/friendships/SendInvite';
import { MainNav } from '@/components/nav/MainNav';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { PageContent, PageNav, PageRoot } from '@a-type/ui';

export interface FriendsPageProps {}

export function FriendsPage({}: FriendsPageProps) {
  useThemedTitleBar();
  return (
    <PageRoot>
      <PageContent gap="lg">
        <FriendInvites />
        <SendInvite />
        <FriendsList />
      </PageContent>
      <PageNav className="bg-white/80 md:rounded-md">
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default FriendsPage;
