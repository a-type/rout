import { OAuthSignInButton } from '@/components/auth/OAuthSignInButton.jsx';
import { PageContent, PageRoot } from '@a-type/ui/components/layouts';
import { H1 } from '@a-type/ui/components/typography';
import { useSearchParams } from '@verdant-web/react-router';

export interface LoginPageProps {}

export function LoginPage({}: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? undefined;

  return (
    <PageRoot>
      <PageContent>
        <H1>Login or Sign Up</H1>
        <OAuthSignInButton provider="google" returnTo={returnTo}>
          Google
        </OAuthSignInButton>
      </PageContent>
    </PageRoot>
  );
}

export default LoginPage;
