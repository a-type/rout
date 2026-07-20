import { MainNav } from '@/components/nav/MainNav';
import { GameStore } from '@/components/store/GameStore';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import { Box, H2, PageContent, PageRoot, Tabs } from '@a-type/ui';
import { useNavigate } from '@tanstack/react-router';

const StorePage = () => {
  useThemedTitleBar();
  const navigate = useNavigate();
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <Box col gap>
          <Tabs
            value="store"
            onValueChange={() => {
              navigate({
                to: '/library',
                viewTransition: false,
              });
            }}
          >
            <Tabs.List>
              <Tabs.Trigger value="library">Your games</Tabs.Trigger>
              <Tabs.Trigger value="store">Store</Tabs.Trigger>
            </Tabs.List>
          </Tabs>
          <Box col gap>
            <H2>Store</H2>
            <GameStore />
          </Box>
        </Box>
      </PageContent>
    </PageRoot>
  );
};

export default StorePage;
