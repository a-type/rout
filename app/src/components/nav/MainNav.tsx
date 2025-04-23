import { NavBar } from '@a-type/ui';
import { Link, useMatchingRoutes } from '@verdant-web/react-router';
import { NotificationsButton } from '../notifications/NotificationsButton';

export interface MainNavProps {}

export function MainNav({}: MainNavProps) {
  const routes = useMatchingRoutes();
  const isHome = routes.some((route) => route.path === '/');
  const isFriends = routes.some((route) => route.path === '/friends');
  const isSettings = routes.some((route) => route.path === '/settings');
  return (
    <NavBar className="bg-overlay md:(mt-8 rounded-md)">
      {/* <span className="hidden sm-block font-[Knewave] font-300 text-center w-full p-2 text-xl">
        rout!
      </span> */}
      <NavBar.Item asChild active={isHome}>
        <Link to="/">
          <NavBar.ItemIcon name="home" />
          <NavBar.ItemText>Games</NavBar.ItemText>
        </Link>
      </NavBar.Item>
      <NavBar.Item asChild active={isFriends}>
        <Link to="/friends">
          <NavBar.ItemIcon name="add_person" />
          <NavBar.ItemText>Friends</NavBar.ItemText>
        </Link>
      </NavBar.Item>
      <NavBar.Item asChild active={isSettings}>
        <Link to="/settings">
          <NavBar.ItemIcon name="gear" />
          <NavBar.ItemText>Settings</NavBar.ItemText>
        </Link>
      </NavBar.Item>
      <NotificationsButton>
        {({ hasUnread }) => (
          <NavBar.Item>
            <NavBar.ItemIcon name="bell" />
            <NavBar.ItemText>Notifications</NavBar.ItemText>
            {hasUnread && <NavBar.ItemPip />}
          </NavBar.Item>
        )}
      </NotificationsButton>
    </NavBar>
  );
}
