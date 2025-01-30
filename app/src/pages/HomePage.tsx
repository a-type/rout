import { CreateGame } from '@/components/games/CreateGame.jsx';
import { MembershipsList } from '@/components/memberships/MembershipsList.jsx';
import { MainNav } from '@/components/nav/MainNav';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.jsx';
import {
  Button,
  H1,
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
        <div className="w-full h-20vh relative flex items-center justify-center">
          <H1 className="!font-[Knewave] ![font-size:12vmin] font-400 text-center relative z-1">
            rout!
          </H1>
          <div className="flex flex-row absolute top-0 right-0 p-4">
            <Button size="icon" asChild>
              <Link to="/settings">
                <Icon name="gear" />
              </Link>
            </Button>
          </div>
        </div>
        <MembershipsList />
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
