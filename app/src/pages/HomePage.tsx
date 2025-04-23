import { CreateGame } from '@/components/games/CreateGame.jsx';
import { MembershipsList } from '@/components/memberships/MembershipsList.jsx';
import { MainNav } from '@/components/nav/MainNav';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.jsx';
import { MyAvatar } from '@/components/users/UserAvatar';
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

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  return (
    <PageRoot>
      <TopographyBackground />
      <PageContent>
        <Box d="row" gap layout="center end" full="width">
          <Button size="small" color="ghost" asChild>
            <Link to="/settings">
              <MyAvatar />
              <Icon name="gear" />
            </Link>
          </Button>
        </Box>
        <Box d="col" gap>
          <H2 className="font-300 text-md uppercase my-0 mx-4">Games</H2>
          <MembershipsList statusFilter={['active']} />
        </Box>
        <PageNowPlaying unstyled className="items-center justify-center">
          <CreateGame />
        </PageNowPlaying>
        <CompleteProfileDialog />
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default HomePage;
