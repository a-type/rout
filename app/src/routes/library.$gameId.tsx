import GameDetailsPage from '@/pages/GameDetailsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/library/$gameId')({
  component: GameDetailsPage,
});
