import FriendsPage from '@/pages/FriendsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/friends')({
  component: FriendsPage,
});
