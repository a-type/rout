import { MembershipsList } from '@/components/memberships/MembershipsList';
import { MainNav } from '@/components/nav/MainNav';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { Box, H1, PageContent, PageNav, PageRoot } from '@a-type/ui';

const HistoryPage = () => {
  useThemedTitleBar();
  return (
    <PageRoot>
      <PageContent>
        <Box full d="col" gap>
          <H1>Game history</H1>
          <MembershipsList />
        </Box>
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default HistoryPage;
