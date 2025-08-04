import { IncomingInvites } from '@/components/friendships/FriendInvites';
import { CreateGame } from '@/components/games/CreateGame.js';
import { CreateHotseat } from '@/components/games/CreateHotseat';
import { HotseatGamesList } from '@/components/memberships/HotseatGamesList';
import { MembershipsList } from '@/components/memberships/MembershipsList.js';
import { MainNav } from '@/components/nav/MainNav';
import { AppInstallBanner } from '@/components/settings/AppInstallBanner';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.js';
import { MyAvatar } from '@/components/users/UserAvatar';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import {
  Box,
  Button,
  H2,
  Icon,
  PageContent,
  PageNav,
  PageNowPlaying,
  PageRoot,
} from '@a-type/ui';
import { TopographyBackground } from '@long-game/game-ui';
import { Link } from '@verdant-web/react-router';
import { Suspense } from 'react';

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  useThemedTitleBar();
  return (
    <PageRoot>
      <TopographyBackground className="fixed" />
      <PageContent className="pb-25vh">
        <Box d="row" gap layout="center end" full="width">
          <Button size="small" color="ghost" asChild>
            <Link to="/settings">
              <MyAvatar />
              <Icon name="gear" />
            </Link>
          </Button>
        </Box>
        <AppInstallBanner />
        <IncomingInvites surface p />
        <Box d="col" gap>
          <H2 className="font-300 text-md uppercase my-0 mx-4">Live Games</H2>
          <MembershipsList
            invitationStatus="accepted"
            statusFilter={['active']}
          />
          <HotseatGamesList status="active" />
          <H2 className="font-300 text-md uppercase my-0 mx-4">
            Upcoming Games
          </H2>
          <MembershipsList
            invitationStatus="accepted"
            statusFilter={['pending']}
          />
          <H2 className="font-300 text-md uppercase my-0 mx-4">Invitations</H2>
          <MembershipsList
            invitationStatus="pending"
            statusFilter={['pending']}
          />
          <Button asChild color="ghost" className="mx-auto color-gray-dark">
            <Link to="/history">
              <Icon name="calendar" />
              History
            </Link>
          </Button>
        </Box>
        <Suspense>
          <CompleteProfileDialog />
        </Suspense>
        <PageNowPlaying
          unstyled
          className="flex-row gap-sm items-center justify-center"
        >
          <CreateHotseat color="default" />
          <CreateGame />
        </PageNowPlaying>
      </PageContent>
      <PageNav className="bg-transparent">
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default HomePage;
