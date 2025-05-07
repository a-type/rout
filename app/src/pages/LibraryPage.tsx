import { OwnedGameList } from '@/components/library/OwnedGameList';
import { MainNav } from '@/components/nav/MainNav';
import { GameStore } from '@/components/store/GameStore';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { Box, H2, PageContent, PageNav, PageRoot } from '@a-type/ui';

const LibraryPage = () => {
  useThemedTitleBar();
  return (
    <PageRoot>
      <PageContent>
        <Box d="col" gap>
          <Box d="col" gap>
            <H2>Your games</H2>
            <OwnedGameList />
          </Box>
          <Box d="col" gap>
            <H2>Store</H2>
            <GameStore />
          </Box>
        </Box>
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default LibraryPage;
