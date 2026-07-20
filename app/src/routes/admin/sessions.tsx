import AdminGameSessionsPage from '@/pages/admin/AdminGameSessionsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/sessions')({
  component: AdminGameSessionsPage,
});
