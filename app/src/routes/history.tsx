import HistoryPage from '@/pages/HistoryPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/history')({
  component: HistoryPage,
});
