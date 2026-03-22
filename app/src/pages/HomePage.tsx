import { IncomingFriendRequests } from '@/components/friendships/FriendInvites';
import { NewGameAction } from '@/components/games/NewGameAction.js';
import { GameSessionInvites } from '@/components/invites/GameSessionInvites';
import { HotseatGamesList } from '@/components/memberships/HotseatGamesList';
import { MembershipsList } from '@/components/memberships/MembershipsList.js';
import { MainNav } from '@/components/nav/MainNav';
import { AppInstallBanner } from '@/components/settings/AppInstallBanner';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.js';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import {
  Box,
  Button,
  Divider,
  H2,
  Icon,
  PageContent,
  PageRoot,
} from '@a-type/ui';
import { Link } from '@verdant-web/react-router';
import { Suspense } from 'react';

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  useThemedTitleBar();
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <AppInstallBanner />
        <IncomingFriendRequests surface color="accent" border p />
        <Box full="width" items="stretch">
          <GameSessionInvites />
        </Box>
        <Box col gap full="width" items="stretch">
          <H2>Online Games</H2>
          <MembershipsList
            invitationStatus="accepted"
            statusFilter={['active']}
          />
        </Box>
        <Box col gap full="width" items="stretch">
          <H2>Hotseat Games</H2>
          <HotseatGamesList status="active" />
        </Box>
        <Divider className="bg-gray" />
        <Button
          emphasis="ghost"
          className="ml-auto color-gray-dark"
          render={<Link to="/history" />}
        >
          <Icon name="calendar" />
          History
          <Icon name="arrowRight" />
        </Button>
        <Suspense>
          <CompleteProfileDialog />
        </Suspense>
        <Box
          gap
          justify="center"
          className="sticky bottom-md pointer-events-none [&>*]:pointer-events-auto"
        >
          <NewGameAction className="shadow-lg" />
        </Box>
      </PageContent>
    </PageRoot>
  );
}

export default HomePage;
