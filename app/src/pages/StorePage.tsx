import { MainNav } from '@/components/nav/MainNav';
import { GameStore } from '@/components/store/GameStore';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { Box, H2, PageContent, PageRoot, Tabs } from '@a-type/ui';
import { useNavigate } from '@verdant-web/react-router';

const LibraryPage = () => {
  useThemedTitleBar();
  const navigate = useNavigate();
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <Box d="col" gap>
          <Tabs
            value="store"
            onValueChange={() => {
              navigate('/library');
            }}
          >
            <Tabs.List>
              <Tabs.Trigger value="library">Your games</Tabs.Trigger>
              <Tabs.Trigger value="store">Store</Tabs.Trigger>
            </Tabs.List>
          </Tabs>
          <Box d="col" gap>
            <H2>Store</H2>
            <GameStore />
          </Box>
        </Box>
      </PageContent>
    </PageRoot>
  );
};

export default LibraryPage;
