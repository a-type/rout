import StorePage from '@/pages/StorePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/store')({
  component: StorePage,
});
