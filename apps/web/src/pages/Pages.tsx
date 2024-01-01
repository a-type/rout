import { makeRoutes, Router, Outlet } from '@verdant-web/react-router';
import HomePage from './HomePage.jsx';
import GameSessionPage from './GameSessionPage.jsx';

const routes = makeRoutes([
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/session/:sessionId',
    component: GameSessionPage,
  },
]);

export const Pages = () => {
  return (
    <Router routes={routes}>
      <Outlet />
    </Router>
  );
};
