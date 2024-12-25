import { makeRoutes, Outlet, Router } from '@verdant-web/react-router';
import { lazy } from 'react';
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
    path: '/verify',
    component: lazy(() => import('./CompleteSignupPage.jsx')),
  },
  {
    path: '/reset-password',
    component: lazy(() => import('./ResetPasswordPage.jsx')),
  },
  {
    path: '/session/:sessionId',
    component: GameSessionPage,
  },
  {
    path: '*',
    component: () => <div>404</div>,
  },
]);

export const Pages = () => {
  return (
    <Router routes={routes}>
      <Outlet />
    </Router>
  );
};
