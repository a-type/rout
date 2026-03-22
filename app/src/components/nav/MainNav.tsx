import { Box, Button, Icon, Tooltip } from '@a-type/ui';
import { Wordmark } from '@long-game/game-ui';
import { Link, useMatchingRoutes } from '@verdant-web/react-router';
import { NotificationsButton } from '../notifications/NotificationsButton.js';
import { MyAvatar } from '../users/UserAvatar.js';

export interface MainNavProps {}

export function MainNav({}: MainNavProps) {
  const routes = useMatchingRoutes();
  const isHome = routes.every((route) => route.path === '/');
  const isFriends = routes.some((route) => route.path === '/friends');
  const isLibrary =
    routes.some((route) => route.path === '/library') ||
    routes.some((route) => route.path === '/store');
  const isSettings = routes.some((route) => route.path === '/settings');
  return (
    <Box gap justify="between" items="center">
      <Tooltip content="Home" disabled={isHome}>
        <Button
          size="wrapper"
          emphasis="ghost"
          render={<Link to="/" />}
          disabled={isHome}
          className="px-md"
        >
          <Wordmark />
        </Button>
      </Tooltip>
      <Box gap items="center">
        <Tooltip content="Notifications">
          <NotificationsButton />
        </Tooltip>
        <Tooltip content="Game Library">
          <Button
            emphasis={isLibrary ? 'primary' : 'ghost'}
            render={<Link to="/library" />}
            size="small"
          >
            <Icon name="gamePiece" />
          </Button>
        </Tooltip>
        <Tooltip content="Friends">
          <Button
            emphasis={isFriends ? 'primary' : 'ghost'}
            render={<Link to="/friends" />}
            size="small"
          >
            <Icon name="profile" />
          </Button>
        </Tooltip>
        <Tooltip content="Settings">
          <Button
            emphasis={isSettings ? 'primary' : 'ghost'}
            render={<Link to="/settings" />}
            size="wrapper"
            className="p-xs"
          >
            <MyAvatar />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}
