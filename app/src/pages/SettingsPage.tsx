import { ColorModeToggle } from '@/components/settings/ColorModeToggle';
import { EditProfileForm } from '@/components/users/EditProfile';
import { API_ORIGIN } from '@/config';
import {
  Box,
  Button,
  Divider,
  H1,
  H2,
  Icon,
  PageContent,
  PageRoot,
} from '@a-type/ui';
import { Link } from '@verdant-web/react-router';

export interface SettingsPageProps {}

export function SettingsPage({}: SettingsPageProps) {
  return (
    <PageRoot>
      <PageContent>
        <Box d="col">
          <Box items="center">
            <Link to="/">
              <Icon name="arrowLeft" />
            </Link>
            <H1>Settings</H1>
          </Box>
          <Divider />
          <H2>You</H2>
          <EditProfileForm />
          <Divider />
          <ColorModeToggle />
          <Divider />
          <form action={`${API_ORIGIN}/auth/logout`} method="post">
            <Button color="destructive" type="submit">
              Logout
            </Button>
          </form>
        </Box>
      </PageContent>
    </PageRoot>
  );
}

export default SettingsPage;
