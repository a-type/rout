import { MainNav } from '@/components/nav/MainNav';
import { Box, PageContent, PageNav, PageRoot } from '@a-type/ui';

const StorePage = () => {
  return (
    <PageRoot>
      <PageContent>
        <Box
          layout="center center"
          full
          className="text-center color-gray-dark"
        >
          Nothing here yet. Come back soon?
        </Box>
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default StorePage;
