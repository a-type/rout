import { API_ORIGIN } from '@/config.js';
import {
  EmailSigninForm,
  EmailSignupForm,
  OAuthSigninButton,
} from '@a-type/auth-ui';
import { H1, H2, PageContent, PageRoot } from '@a-type/ui';
import { useSearchParams } from '@verdant-web/react-router';

export interface LoginPageProps {}

export function LoginPage({}: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;

  return (
    <PageRoot>
      <PageContent>
        <H1>Login or Sign Up</H1>
        <OAuthSigninButton
          endpoint={`${API_ORIGIN}/auth/provider/google/login`}
          returnTo={returnTo}
        >
          Google
        </OAuthSigninButton>
        <H2>Sign in with email</H2>
        <EmailSigninForm
          endpoint={`${API_ORIGIN}/auth/email-login`}
          resetPasswordEndpoint={`${API_ORIGIN}/auth/begin-reset-password`}
        />
        <H2>Sign up with email</H2>
        <EmailSignupForm endpoint={`${API_ORIGIN}/auth/begin-email-signup`} />
      </PageContent>
    </PageRoot>
  );
}

export default LoginPage;
