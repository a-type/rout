import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { API_ORIGIN } from '@/config.js';
import { H1, P, PageContent, PageRoot } from '@a-type/ui';
import { useSearch } from '@tanstack/react-router';

export interface ResetPasswordPageProps {}

export function ResetPasswordPage({}: ResetPasswordPageProps) {
  const { code, email } = useSearch({
    from: '/reset-password',
  });

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
          endpoint={`${API_ORIGIN}/auth/complete-reset-password`}
        />
      </PageContent>
    </PageRoot>
  );
}

export default ResetPasswordPage;
