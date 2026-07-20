import { Box, Button, Icon, Tooltip } from '@a-type/ui';
import { Wordmark } from '@long-game/game-ui';
import { Link, useMatches } from '@tanstack/react-router';
import { NotificationsButton } from '../notifications/NotificationsButton.js';
import { MyAvatar } from '../users/UserAvatar.js';
import cls from './MainNav.module.css';

export interface MainNavProps {}

export function MainNav({}: MainNavProps) {
  const routes = useMatches();
  const isHome = routes.every((route) => route.pathname === '/');
  const isFriends = routes.some((route) => route.pathname === '/friends');
  const isLibrary =
    routes.some((route) => route.pathname === '/library') ||
    routes.some((route) => route.pathname === '/store');
  const isSettings = routes.some((route) => route.pathname === '/settings');
  return (
    <Box gap justify="between" items="center">
      <Tooltip content="Home" disabled={isHome}>
        <Button
          size="wrapper"
          emphasis="ghost"
          nativeButton={false}
          render={<Link to="/" />}
          disabled={isHome}
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
            nativeButton={false}
            render={<Link to="/library" />}
            size="small"
          >
            <Icon name="gamePiece" />
          </Button>
        </Tooltip>
        <Tooltip content="Friends">
          <Button
            emphasis={isFriends ? 'primary' : 'ghost'}
            nativeButton={false}
            render={<Link to="/friends" />}
            size="small"
          >
            <Icon name="profile" />
          </Button>
        </Tooltip>
        <Tooltip content="Settings">
          <Button
            emphasis={isSettings ? 'primary' : 'ghost'}
            nativeButton={false}
            render={<Link to="/settings" />}
            size="wrapper"
            className={cls.avatarButton}
          >
            <MyAvatar />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}
