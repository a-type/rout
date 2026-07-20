import PublicGameListPage from '@/pages/PublicGameListPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/games')({
  component: PublicGameListPage,
});
