import CompleteSignupPage from '@/pages/CompleteSignupPage';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import z from 'zod';

export const Route = createFileRoute('/verify')({
  component: CompleteSignupPage,
  validateSearch: zodValidator(
    z.object({
      code: z.string(),
      email: z.string().email(),
    }),
  ),
});
