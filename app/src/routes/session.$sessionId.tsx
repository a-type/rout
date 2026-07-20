import GameSessionPage from '@/pages/GameSessionPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$sessionId')({
  component: GameSessionPage,
});
