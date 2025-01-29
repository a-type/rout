import { CreateGame } from '@/components/games/CreateGame.jsx';
import { MembershipsList } from '@/components/memberships/MembershipsList.jsx';
import { MainNav } from '@/components/nav/MainNav';
import { CompleteProfileDialog } from '@/components/users/CompleteProfileDialog.jsx';
import { EditProfileButton } from '@/components/users/EditProfile.jsx';
import { H1, PageContent, PageNav, PageNowPlaying, PageRoot } from '@a-type/ui';
import { TopographyBackground } from '@long-game/game-ui';

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  return (
    <PageRoot>
      <PageContent>
        <div className="w-full h-20vh relative flex items-center justify-center">
          <TopographyBackground />
          <H1 className="!font-[Knewave] ![font-size:12vmin] text-center relative z-1">
            rout!
          </H1>
          <div className="flex flex-row absolute top-0 right-0 p-4">
            <EditProfileButton />
          </div>
        </div>
        <MembershipsList />
        <PageNowPlaying unstyled>
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
