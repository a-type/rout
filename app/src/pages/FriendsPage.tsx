import { FriendInvites } from '@/components/friendships/FriendInvites';
import { FriendsList } from '@/components/friendships/FriendsList';
import { SendInvite } from '@/components/friendships/SendInvite';
import { MainNav } from '@/components/nav/MainNav';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { PageContent, PageRoot } from '@a-type/ui';

export interface FriendsPageProps {}

export function FriendsPage({}: FriendsPageProps) {
  useThemedTitleBar();
  return (
    <PageRoot>
      <PageContent gap="lg">
        <MainNav />
        <FriendInvites />
        <SendInvite />
        <FriendsList />
      </PageContent>
    </PageRoot>
  );
}

export default FriendsPage;
