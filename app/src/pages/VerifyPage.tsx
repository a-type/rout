import { EmailCompleteSignupForm } from '@/components/auth/EmailCompleteSignupForm';
import { API_ORIGIN } from '@/config.js';
import { H1, P, PageContent, PageRoot } from '@a-type/ui';
import { useSearch } from '@tanstack/react-router';

export interface VerifyPageProps {}

export function VerifyPage({}: VerifyPageProps) {
  const { code, email } = useSearch({
    from: '/verify',
  });

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
