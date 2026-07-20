import { NewGameWizard } from '@/components/games/NewGameWizard';
import { PushBanner } from '@/components/notifications/PushBanner';
import { QuickBuyPopup } from '@/components/store/QuickBuyPopup';
import { Box } from '@a-type/ui';
import { idShapes } from '@long-game/common';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import z from 'zod';

export const Route = createRootRoute({
  component: RootComponent,
  validateSearch: zodValidator(
    z
      .object({
        quickBuy: z.string(),
        newGame: z.boolean(),
        rules: z.boolean(),
        mode: z.enum(['hotseat', 'live']),
        playerId: idShapes.User,
        productId: idShapes.GameProduct,
      })
      .partial(),
  ),
});

function RootComponent() {
  return (
    <>
      <Box full="width" grow col>
        <Outlet />
      </Box>
      <QuickBuyPopup />
      <PushBanner />
      <NewGameWizard />
    </>
  );
}
