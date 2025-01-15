import { API_ORIGIN } from '@/config.js';
import { EmailCompleteSignupForm } from '@a-type/auth-ui';
import { H1, P, PageContent, PageRoot } from '@a-type/ui';
import { useSearchParams } from '@verdant-web/react-router';

export interface CompleteSignupPageProps {}

export function CompleteSignupPage({}: CompleteSignupPageProps) {
  const [params] = useSearchParams();
  const code = params.get('code');
  const email = params.get('email');

  if (!code || !email) {
    return (
      <PageRoot>
        <PageContent>
          <H1>Invalid link</H1>
          <P>That link doesn't seem right. Maybe try signing up again.</P>
        </PageContent>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <PageContent>
        <H1>Complete Signup</H1>
        <EmailCompleteSignupForm
          code={code}
          email={email}
          endpoint={`${API_ORIGIN}/auth/complete-email-signup`}
        />
      </PageContent>
    </PageRoot>
  );
}

export default CompleteSignupPage;
