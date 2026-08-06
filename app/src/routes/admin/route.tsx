import AdminPage from '@/pages/admin/AdminPage';
import { idShapes } from '@long-game/common';
import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import z from 'zod';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
  validateSearch: zodValidator(
    z
      .object({
        productId: idShapes.GameProduct,
      })
      .partial(),
  ),
});
