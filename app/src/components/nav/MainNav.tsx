import { NavBar } from '@a-type/ui';
import { Wordmark } from '@long-game/game-ui';
import { Link, useMatchingRoutes } from '@verdant-web/react-router';
import { NotificationsButton } from '../notifications/NotificationsButton';

export interface MainNavProps {}

export function MainNav({}: MainNavProps) {
  const routes = useMatchingRoutes();
  const isHome = routes.every((route) => route.path === '/');
  const isFriends = routes.some((route) => route.path === '/friends');
  const isLibrary = routes.some((route) => route.path === '/library');
  return (
    <NavBar className="bg-overlay md:(mt-8 rounded-md)">
      <Wordmark className="hidden sm-block font-[Knewave] text-center w-full p-2 text-xl" />
      <NavBar.Item asChild active={isHome}>
        <Link to="/">
          <NavBar.ItemIcon name="home" />
          <NavBar.ItemText>Home</NavBar.ItemText>
        </Link>
      </NavBar.Item>
      <NavBar.Item asChild active={isFriends}>
        <Link to="/friends">
          <NavBar.ItemIcon name="add_person" />
          <NavBar.ItemText>Friends</NavBar.ItemText>
        </Link>
      </NavBar.Item>
      <NavBar.Item asChild active={isLibrary}>
        <Link to="/library">
          <NavBar.ItemIcon name="gamePiece" />
          <NavBar.ItemText>Library</NavBar.ItemText>
        </Link>
      </NavBar.Item>
      <NotificationsButton>
        {({ hasUnread }) => (
          <NavBar.Item>
            <NavBar.ItemIcon name="bell" />
            <NavBar.ItemText>Notifs</NavBar.ItemText>
            {hasUnread && <NavBar.ItemPip />}
          </NavBar.Item>
        )}
      </NotificationsButton>
    </NavBar>
  );
}
