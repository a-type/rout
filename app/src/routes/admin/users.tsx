import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
});
