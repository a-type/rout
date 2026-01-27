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
  Divider,
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
          <Button
            size="small"
            emphasis="ghost"
            render={<Link to="/settings" />}
          >
            <MyAvatar />
            <Icon name="gear" />
          </Button>
        </Box>
        <AppInstallBanner />
        <IncomingInvites surface p />
        <Box d="col" gap="lg">
          <Box col gap>
            <H2 className="font-300 text-md uppercase my-0 mx-4">
              <Icon name="gamePiece" /> Live Games
            </H2>
            <MembershipsList
              invitationStatus="accepted"
              statusFilter={['active']}
            />
          </Box>
          <Box col gap>
            <H2 className="font-300 text-md uppercase my-0 mx-4">
              <Icon name="phone" /> Hotseat Games
            </H2>
            <HotseatGamesList status="active" />
          </Box>
          <Box col gap>
            <H2 className="font-300 text-md uppercase my-0 mx-4">
              <Icon name="clock" /> Upcoming Games
            </H2>
            <MembershipsList
              invitationStatus="accepted"
              statusFilter={['pending']}
              emptyState="No upcoming games"
            />
          </Box>
          <Box col gap>
            <H2 className="font-300 text-md uppercase my-0 mx-4">
              Invitations
            </H2>
            <MembershipsList
              invitationStatus="pending"
              statusFilter={['pending']}
              emptyState="No pending invitations"
            />
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
        </Box>
        <Suspense>
          <CompleteProfileDialog />
        </Suspense>
        <PageNowPlaying className="flex-row gap-sm items-center justify-center">
          <CreateHotseat emphasis="default" />
          <CreateGame />
        </PageNowPlaying>
      </PageContent>
      <PageNav className="bg-white/80 md:rounded-md">
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default HomePage;
