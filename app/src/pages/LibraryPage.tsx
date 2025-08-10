import { OwnedGameList } from '@/components/library/OwnedGameList';
import { MainNav } from '@/components/nav/MainNav';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { Box, H2, PageContent, PageNav, PageRoot, Tabs } from '@a-type/ui';
import { useNavigate } from '@verdant-web/react-router';

const LibraryPage = () => {
  useThemedTitleBar();
  const navigate = useNavigate();
  return (
    <PageRoot>
      <PageContent>
        <Box d="col" gap>
          <Tabs
            value="library"
            onValueChange={() => {
              navigate('/store');
            }}
          >
            <Tabs.List>
              <Tabs.Trigger value="library">Your games</Tabs.Trigger>
              <Tabs.Trigger value="store">Store</Tabs.Trigger>
            </Tabs.List>
          </Tabs>
          <Box d="col" gap>
            <H2>Your games</H2>
            <OwnedGameList />
          </Box>
        </Box>
      </PageContent>
      <PageNav className="bg-white/80 md:rounded-md">
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default LibraryPage;
