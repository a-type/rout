import { makeRoutes, Router, Outlet } from '@verdant-web/react-router';
import HomePage from './HomePage.jsx';
import GameSessionPage from './GameSessionPage.jsx';
import { lazy } from 'react';

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
