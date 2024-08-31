import { API_HOST_HTTP } from "@/config.js";
import { ResetPasswordForm } from "@a-type/auth-client";
import { PageContent, PageRoot } from "@a-type/ui/components/layouts";
import { H1, P } from "@a-type/ui/components/typography";
import { useSearchParams } from "@verdant-web/react-router";

export interface ResetPasswordPageProps {

}

export function ResetPasswordPage({  }: ResetPasswordPageProps) {
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
		)
	}

	return (
		<PageRoot>
			<PageContent>
				<H1>Complete Signup</H1>
				<ResetPasswordForm code={code} email={email} endpoint={`${API_HOST_HTTP}/auth/complete-email-signup`} />
			</PageContent>
		</PageRoot>
	)
}

export default ResetPasswordPage;
