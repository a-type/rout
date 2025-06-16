import { QuickBuyPopup } from '@/components/store/QuickBuyPopup.js';
import {
  checkForUpdate,
  updateApp,
  updateState,
} from '@/components/updates/updateState.js';
import { Box, ErrorBoundary } from '@a-type/ui';
import { makeRoutes, Outlet, Router } from '@verdant-web/react-router';
import { lazy, useCallback } from 'react';
import GameSessionPage from './GameSessionPage.jsx';
import HomePage from './HomePage.jsx';

const routes = makeRoutes([
  {
    path: '/',
    index: true,
    component: HomePage,
  },
  {
    path: '/login',
    component: lazy(() => import('./LoginPage.jsx')),
  },
  {
    path: '/invite/:inviteId',
    component: lazy(() => import('./InvitePage.jsx')),
  },
  {
    path: '/verify',
    component: lazy(() => import('./CompleteSignupPage.jsx')),
  },
  {
    path: '/reset-password',
    component: lazy(() => import('./ResetPasswordPage.jsx')),
  },
  {
    path: '/friends',
    component: lazy(() => import('./FriendsPage.jsx')),
  },
  {
    path: '/history',
    component: lazy(() => import('./HistoryPage.jsx')),
  },
  {
    path: '/session/:sessionId',
    component: GameSessionPage,
  },
  {
    path: '/gameInvite/:code',
    component: lazy(() => import('./GameInviteLinkPage.jsx')),
  },
  {
    path: '/library',
    component: Outlet,
    children: [
      {
        index: true,
        component: lazy(() => import('./LibraryPage.js')),
      },
      {
        path: ':gameId',
        component: lazy(() => import('./GameDetailsPage.jsx')),
      },
    ],
  },
  {
    path: '/settings',
    component: lazy(() => import('./SettingsPage.jsx')),
  },
  {
    path: '/admin',
    component: lazy(() => import('./admin/AdminPage.jsx')),
    children: [
      {
        index: true,
        component: () => <div>Admin Home</div>,
      },
      {
        path: 'products',
        component: lazy(() => import('./admin/AdminGameProductsPage.jsx')),
      },
      {
        path: 'sessions',
        component: lazy(() => import('./admin/AdminGameSessionsPage.jsx')),
      },
      {
        path: 'users',
        component: lazy(() => import('./admin/AdminUsersPage.jsx')),
      },
    ],
  },
  {
    path: '*',
    component: () => <div>404</div>,
  },
]);

export const Pages = () => {
  const handleNavigate = useCallback(
    (
      location: Location,
      ev: { state?: any; skipTransition?: boolean },
      prev?: { pathname: string },
    ) => {
      checkForUpdate();
      // only update on path changes
      if (
        updateState.updateAvailable &&
        location.pathname !== prev?.pathname &&
        !ev.state?.noUpdate
      ) {
        console.info('Update ready to install, intercepting navigation...');
        updateApp(ev?.state?.isSwipeNavigation);
        return false;
      }
      if (!prev) {
        return;
      }
    },
    [],
  );
  return (
    <ErrorBoundary
      // TODO: use error details to show different error messages
      fallback={
        <Box full layout="center center">
          Something went wrong!
        </Box>
      }
    >
      <Router routes={routes} onNavigate={handleNavigate}>
        <Outlet />
        <QuickBuyPopup />
      </Router>
    </ErrorBoundary>
  );
};
