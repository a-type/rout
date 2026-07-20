import { GlobalErrorFallback } from '@a-type/ui';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.js';
import { updateApp, updateState } from './swRegister.js';

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultErrorComponent: GlobalErrorFallback,
  defaultViewTransition: true,
  search: { strict: false },
});

router.subscribe('onBeforeNavigate', (event) => {
  // only update on path changes
  if (updateState.updateAvailable && event.pathChanged) {
    console.info('Update ready to install, intercepting navigation...');
    updateApp();
    return false;
  }
  if (!event.fromLocation) {
    return;
  }
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
