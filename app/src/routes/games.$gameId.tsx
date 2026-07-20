import PublicGamePage from '@/pages/PublicGamePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/games/$gameId')({
  component: PublicGamePage,
});
