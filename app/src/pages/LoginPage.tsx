import { API_ORIGIN } from '@/config.js';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import {
  EmailSigninForm,
  EmailSignupForm,
  OAuthSigninButton,
} from '@a-type/auth-ui';
import { Box, H2, Tabs } from '@a-type/ui';
import { TopographyBackground, Wordmark } from '@long-game/game-ui';
import { Link, useSearchParams } from '@verdant-web/react-router';

export interface LoginPageProps {}

export function LoginPage({}: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;
  const tab = searchParams.get('tab') ?? 'login';
  useThemedTitleBar();

  return (
    <Box full grow layout="center center">
      <TopographyBackground className="fixed" />
      <Box
        p
        col
        layout="center center"
        className="m-auto relative z-1"
        grow
        gap
      >
        <Wordmark className="text-5xl" />
        <Tabs
          value={tab}
          defaultValue="login"
          render={<Box items="center" d="col" gap container="reset" />}
        >
          <Tabs.List className="justify-center" color="primary">
            <Tabs.Trigger value="login" render={<Link to="?tab=login" />}>
              Log in
            </Tabs.Trigger>
            <Tabs.Trigger value="signup" render={<Link to="?tab=signup" />}>
              Sign up
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content
            value="login"
            render={<Box d="col" gap items="center" />}
          >
            <OAuthSigninButton
              endpoint={`${API_ORIGIN}/auth/provider/google/login`}
              returnTo={returnTo}
              color="primary"
              emphasis="primary"
            >
              Log in with Google
            </OAuthSigninButton>
            <Box d="col" p gap surface="white" border>
              <H2>Log in with email</H2>
              <EmailSigninForm
                endpoint={`${API_ORIGIN}/auth/email-login`}
                resetPasswordEndpoint={`${API_ORIGIN}/auth/begin-reset-password`}
                returnTo={returnTo}
              />
            </Box>
          </Tabs.Content>
          <Tabs.Content
            value="signup"
            render={<Box d="col" gap items="center" />}
          >
            <OAuthSigninButton
              endpoint={`${API_ORIGIN}/auth/provider/google/login`}
              returnTo={returnTo}
              color="primary"
              emphasis="primary"
            >
              Sign up with Google
            </OAuthSigninButton>
            <Box d="col" p gap surface="white" border>
              <H2>Sign up with email</H2>
              <EmailSignupForm
                endpoint={`${API_ORIGIN}/auth/begin-email-signup`}
                returnTo={returnTo}
                disableName
              />
            </Box>
          </Tabs.Content>
        </Tabs>
      </Box>
    </Box>
  );
}

export default LoginPage;
