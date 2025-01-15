import { API_ORIGIN } from '@/config.js';
import { ResetPasswordForm } from '@a-type/auth-ui';
import { H1, P, PageContent, PageRoot } from '@a-type/ui';
import { useSearchParams } from '@verdant-web/react-router';

export interface ResetPasswordPageProps {}

export function ResetPasswordPage({}: ResetPasswordPageProps) {
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
        <ResetPasswordForm
          code={code}
          email={email}
          endpoint={`${API_ORIGIN}/auth/complete-email-signup`}
        />
      </PageContent>
    </PageRoot>
  );
}

export default ResetPasswordPage;
