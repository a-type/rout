import { MainNav } from '@/components/nav/MainNav';
import { Box, H1, PageContent, PageRoot } from '@a-type/ui';
import { Link, Outlet } from '@verdant-web/react-router';

const AdminPage = () => {
  return (
    <PageRoot>
      <PageContent>
        <MainNav />
        <H1>Admin</H1>
        <Box gap>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/sessions">Sessions</Link>
          <Link to="/admin/users">Users</Link>
        </Box>
        <Outlet />
      </PageContent>
    </PageRoot>
  );
};

export default AdminPage;
