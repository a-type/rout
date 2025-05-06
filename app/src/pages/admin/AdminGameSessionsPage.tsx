import { AdminListGameSessions } from '@/components/admin/AdminListGameSessions';
import { Box } from '@a-type/ui';

const AdminGameSessionsPage = () => {
  return (
    <Box d="col" p gap>
      <AdminListGameSessions />
    </Box>
  );
};

export default AdminGameSessionsPage;
