import { API_ORIGIN } from '@/config.js';
import { useThemedTitleBar } from '@/hooks/useThemedTitleBar';
import {
  EmailSigninForm,
  EmailSignupForm,
  OAuthSigninButton,
} from '@a-type/auth-ui';
import { Box, H1, H2, Tabs } from '@a-type/ui';
import { GameIllustration1, TopographyBackground } from '@long-game/game-ui';
import { Link, useSearchParams } from '@verdant-web/react-router';

export interface LoginPageProps {}

export function LoginPage({}: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;
  const tab = searchParams.get('tab') ?? 'login';
  useThemedTitleBar();

  return (
    <Box className="w-full h-full" layout="center center">
      <TopographyBackground />
      <Box p className="flex-col lg:flex-row m-auto relative z-1" gap>
        <Box
          d={{
            sm: 'col-reverse',
            lg: 'col',
          }}
          gap="none"
          items="center"
        >
          <H1 className="!font-[Knewave] !text-4xl !font-medium">
            Let's play!
          </H1>
          <GameIllustration1 className="h-15vh lg:h-40vh" />
        </Box>
        <Tabs value={tab} defaultValue="login" asChild>
          <Box items="center" d="col" gap container="reset">
            <Tabs.List className="justify-center w-full">
              <Tabs.Trigger value="login" asChild color="primary">
                <Link to="?tab=login">Log in</Link>
              </Tabs.Trigger>
              <Tabs.Trigger value="signup" asChild color="primary">
                <Link to="?tab=signup">Sign up</Link>
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="login" asChild>
              <Box d="col" gap items="center">
                <OAuthSigninButton
                  endpoint={`${API_ORIGIN}/auth/provider/google/login`}
                  returnTo={returnTo}
                  color="accent"
                >
                  Log in with Google
                </OAuthSigninButton>
                <Box d="col" p gap surface>
                  <H2>Log in with email</H2>
                  <EmailSigninForm
                    endpoint={`${API_ORIGIN}/auth/email-login`}
                    resetPasswordEndpoint={`${API_ORIGIN}/auth/begin-reset-password`}
                    returnTo={returnTo}
                  />
                </Box>
              </Box>
            </Tabs.Content>
            <Tabs.Content value="signup" asChild>
              <Box d="col" gap items="center">
                <OAuthSigninButton
                  endpoint={`${API_ORIGIN}/auth/provider/google/login`}
                  returnTo={returnTo}
                  color="accent"
                >
                  Sign up with Google
                </OAuthSigninButton>
                <Box d="col" p gap surface>
                  <H2>Sign up with email</H2>
                  <EmailSignupForm
                    endpoint={`${API_ORIGIN}/auth/begin-email-signup`}
                    returnTo={returnTo}
                  />
                </Box>
              </Box>
            </Tabs.Content>
          </Box>
        </Tabs>
      </Box>
    </Box>
  );
}

export default LoginPage;
