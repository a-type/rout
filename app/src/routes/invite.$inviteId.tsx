import InvitePage from '@/pages/InvitePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/invite/$inviteId')({
  component: InvitePage,
});
