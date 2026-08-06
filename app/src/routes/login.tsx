import LoginPage from '@/pages/LoginPage';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import z from 'zod';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: zodValidator(
    z
      .object({
        returnTo: z.string(),
        tab: z.enum(['login', 'signup']),
      })
      .partial(),
  ),
});
