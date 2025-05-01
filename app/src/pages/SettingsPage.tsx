import { MainNav } from '@/components/nav/MainNav';
import { ColorModeToggle } from '@/components/settings/ColorModeToggle';
import { GoldUpgrade } from '@/components/subscription/GoldUpgrade';
import { ManageSubscription } from '@/components/subscription/ManageSubscription';
import { EditProfileForm } from '@/components/users/EditProfile';
import { API_ORIGIN } from '@/config';
import { sdkHooks } from '@/services/publicSdk';
import {
  Box,
  Button,
  Divider,
  H1,
  H2,
  PageContent,
  PageNav,
  PageRoot,
} from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface SettingsPageProps {}

export function SettingsPage({}: SettingsPageProps) {
  const { data: me } = sdkHooks.useGetMe();

  return (
    <PageRoot>
      <PageContent>
        <Box d="col" gap>
          <H1>Settings</H1>

          <Divider />
          <Box d="col" gap>
            <H2>You</H2>
            <EditProfileForm />
          </Box>
          <Divider />
          <ColorModeToggle />
          <GoldUpgrade />
          <ManageSubscription />
          <Divider />
          <form action={`${API_ORIGIN}/auth/logout`} method="post">
            <Button color="destructive" type="submit">
              Logout
            </Button>
          </form>
          <Divider />
          <Box d="col" gap>
            <H2>Support</H2>
            <a href="https://rout.games/privacy">Privacy Policy</a>
            <a href="https://rout.games/tos">Terms of Service</a>
          </Box>
          {me?.isProductAdmin && (
            <>
              <Divider />
              <Button asChild color="ghost">
                <Link to="/admin">Admin</Link>
              </Button>
            </>
          )}
        </Box>
      </PageContent>
      <PageNav>
        <MainNav />
      </PageNav>
    </PageRoot>
  );
}

export default SettingsPage;
