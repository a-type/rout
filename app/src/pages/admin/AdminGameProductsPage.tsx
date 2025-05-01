import { AdminCreateProduct } from '@/components/admin/AdminCreateProduct';
import { AdminEditProduct } from '@/components/admin/AdminEditProduct';
import { AdminViewProducts } from '@/components/admin/AdminViewProducts';
import { Box } from '@a-type/ui';

const AdminGameProductsPage = () => {
  return (
    <Box d="col" p gap>
      <AdminCreateProduct />
      <AdminEditProduct />
      <AdminViewProducts />
    </Box>
  );
};

export default AdminGameProductsPage;
