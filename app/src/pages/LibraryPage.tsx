import { OwnedGameList } from '@/components/library/OwnedGameList';
import { MainNav } from '@/components/nav/MainNav';
import { H2, PageContent, PageNav, PageRoot } from '@a-type/ui';

const LibraryPage = () => {
  return (
    <PageRoot>
      <PageContent>
        <H2>Your games</H2>
        <OwnedGameList />
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default LibraryPage;
