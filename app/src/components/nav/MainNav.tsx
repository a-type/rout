import { NavBar } from '@a-type/ui';
import { Link, useMatchingRoutes } from '@verdant-web/react-router';

export interface MainNavProps {}

export function MainNav({}: MainNavProps) {
  const routes = useMatchingRoutes();
  const isHome = routes.some((route) => route.path === '/');
  const isFriends = routes.some((route) => route.path === '/friends');
  return (
    <NavBar className="md:(mt-8 rounded-md bg-overlay)">
      {/* <span className="hidden sm-block font-[Knewave] text-center w-full p-2 text-xl">
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
    </NavBar>
  );
}
