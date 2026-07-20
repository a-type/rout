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
import { Link } from '@tanstack/react-router';
import { Suspense } from 'react';
import cls from './HomePage.module.css';

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  useThemedTitleBar();
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <AppInstallBanner />
        <IncomingFriendRequests surface color="accent" border p />
        <Box full="width" items="stretch" id="game-invites">
          <GameSessionInvites />
        </Box>
        <Box col gap full="width" items="stretch">
          <H2 id="online-games">Online Games</H2>
          <MembershipsList
            invitationStatus="accepted"
            statusFilter={['active']}
          />
        </Box>
        <Box col gap full="width" items="stretch">
          <H2 id="hotseat-games">Hotseat Games</H2>
          <HotseatGamesList status="active" />
        </Box>
        <Divider className="bg-gray" />
        <Button
          emphasis="ghost"
          nativeButton={false}
          render={<Link to="/history" />}
        >
          <Icon name="calendar" />
          History
          <Icon name="arrowRight" />
        </Button>
        <Suspense>
          <CompleteProfileDialog />
        </Suspense>
        <Box gap justify="center" className={cls.newGameAction}>
          <NewGameAction className="shadow-lg" />
        </Box>
      </PageContent>
    </PageRoot>
  );
}

export default HomePage;
