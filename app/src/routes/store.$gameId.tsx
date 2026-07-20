import GameDetailsPage from '@/pages/GameDetailsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/store/$gameId')({
  component: GameDetailsPage,
});
