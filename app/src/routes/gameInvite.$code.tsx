import GameInviteLinkPage from '@/pages/GameInviteLinkPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/gameInvite/$code')({
  component: GameInviteLinkPage,
});
