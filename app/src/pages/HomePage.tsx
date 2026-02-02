import { IncomingInvites } from '@/components/friendships/FriendInvites';
import { CreateGame } from '@/components/games/CreateGame.js';
import { CreateHotseat } from '@/components/games/CreateHotseat';
import { HotseatGamesList } from '@/components/memberships/HotseatGamesList';
import { MembershipsList } from '@/components/memberships/MembershipsList.js';
import {
  HomeNavRoot,
  HomeNavSection,
  HomeNavTriggers,
} from '@/components/nav/HomeNav';
import { MainNav } from '@/components/nav/MainNav';
import { AppInstallBanner } from '@/components/settings/AppInstallBanner';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.js';
import { MyAvatar } from '@/components/users/UserAvatar';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import {
  Box,
  Button,
  Divider,
  Icon,
  PageContent,
  PageFixedArea,
  PageNav,
  PageNowPlaying,
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
        <PageFixedArea className="bg-transparent top-sm">
          <Box d="row" gap layout="center end" full="width">
            <HomeNavTriggers />
            <Button
              size="small"
              emphasis="ghost"
              render={<Link to="/settings" />}
            >
              <MyAvatar />
              <Icon name="gear" />
            </Button>
          </Box>
        </PageFixedArea>
        <HomeNavRoot>
          <AppInstallBanner />
          <IncomingInvites surface p />
          <HomeNavSection id="live" title="Live Games">
            <MembershipsList
              invitationStatus="accepted"
              statusFilter={['active']}
            />
          </HomeNavSection>
          <HomeNavSection id="hotseat" title="Hotseat Games">
            <HotseatGamesList status="active" />
          </HomeNavSection>
          <HomeNavSection id="upcoming" title="Upcoming Games">
            <MembershipsList
              invitationStatus="accepted"
              statusFilter={['pending']}
              emptyState="No upcoming games"
            />
          </HomeNavSection>
          <HomeNavSection id="invites" title="Invitations">
            <MembershipsList
              invitationStatus="pending"
              statusFilter={['pending']}
              emptyState="No pending invitations"
            />
          </HomeNavSection>
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
          <PageNowPlaying className="flex-row gap-sm items-center justify-center">
            <CreateHotseat emphasis="default" />
            <CreateGame />
          </PageNowPlaying>
        </HomeNavRoot>
      </PageContent>
      <PageNav className="bg-white/80 md:rounded-md">
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default HomePage;
