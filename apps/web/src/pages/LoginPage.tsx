import { PageContent, PageRoot } from '@a-type/ui/components/layouts';
import { H1, H2 } from '@a-type/ui/components/typography';
import { useSearchParams } from '@verdant-web/react-router';
import { OAuthSigninButton, EmailSignupForm, EmailSigninForm } from '@a-type/auth-client';
import { API_HOST_HTTP } from '@/config.js';

export interface LoginPageProps {}

export function LoginPage({}: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;

  return (
    <PageRoot>
      <PageContent>
        <H1>Login or Sign Up</H1>
        <OAuthSigninButton endpoint={`${API_HOST_HTTP}/auth/provider/google/login`} returnTo={returnTo}>
          Google
        </OAuthSigninButton>
        <H2>Sign in with email</H2>
        <EmailSigninForm endpoint={`${API_HOST_HTTP}/auth/email-login`} resetPasswordEndpoint={`${API_HOST_HTTP}/auth/begin-reset-password`} />
        <H2>Sign up with email</H2>
        <EmailSignupForm endpoint={`${API_HOST_HTTP}/auth/begin-email-signup`} />
      </PageContent>
    </PageRoot>
  );
}

export default LoginPage;
