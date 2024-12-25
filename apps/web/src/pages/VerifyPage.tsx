import { API_ORIGIN } from '@/config.js';
import { EmailCompleteSignupForm } from '@a-type/auth-client';
import { H1, P, PageContent, PageRoot } from '@a-type/ui';
import { useSearchParams } from '@verdant-web/react-router';

export interface VerifyPageProps {}

export function VerifyPage({}: VerifyPageProps) {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const email = searchParams.get('email');

  if (!code || !email) {
    return (
      <PageRoot>
        <PageContent>
          <H1>Invalid verification link</H1>
          <P>Try signing up again.</P>
        </PageContent>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <PageContent>
        <H1>Complete your signup</H1>
        <EmailCompleteSignupForm
          endpoint={`${API_ORIGIN}/auth/complete-email-signup`}
          code={code}
          email={email}
        />
      </PageContent>
    </PageRoot>
  );
}

export default VerifyPage;
