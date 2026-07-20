import AdminGameProductsPage from '@/pages/admin/AdminGameProductsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/products')({
  component: AdminGameProductsPage,
});
