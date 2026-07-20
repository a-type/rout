import HotseatSessionPage from '@/pages/HotseatSessionPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/hotseat/$sessionId')({
  component: HotseatSessionPage,
});
