import { MainNav } from '@/components/nav/MainNav';
import { Box, H1, PageContent, PageNav, PageRoot } from '@a-type/ui';
import { Link, Outlet } from '@verdant-web/react-router';

const AdminPage = () => {
  return (
    <PageRoot>
      <PageContent>
        <H1>Admin</H1>
        <Box gap>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/sessions">Sessions</Link>
        </Box>
        <Outlet />
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
};

export default AdminPage;
