import { CreateGame } from '@/components/games/CreateGame.jsx';
import { MembershipsList } from '@/components/memberships/MembershipsList.jsx';
import {
  PageContent,
  PageNowPlaying,
  PageRoot,
} from '@a-type/ui/components/layouts';

export interface HomePageProps {}

export function HomePage({}: HomePageProps) {
  return (
    <PageRoot>
      <PageContent>
        <MembershipsList />
        <PageNowPlaying unstyled>
          <CreateGame />
        </PageNowPlaying>
      </PageContent>
    </PageRoot>
  );
}

export default HomePage;
