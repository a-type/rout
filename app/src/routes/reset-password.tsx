import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import z from 'zod';

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: zodValidator(
    z.object({
      code: z.string(),
      email: z.string().email(),
    }),
  ),
});
