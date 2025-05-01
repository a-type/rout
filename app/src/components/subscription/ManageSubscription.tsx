import { API_ORIGIN } from '@/config';
import { sdkHooks } from '@/services/publicSdk';
import { Button, ButtonProps } from '@a-type/ui';

export interface ManageSubscriptionProps extends ButtonProps {}

export function ManageSubscription({
  className,
  ...props
}: ManageSubscriptionProps) {
  const { data: me } = sdkHooks.useGetMe();

  if (!me?.isCustomer) {
    return null;
  }

  return (
    <form
      action={`${API_ORIGIN}/stripe/portal-session`}
      method="post"
      className={className}
    >
      <Button type="submit" {...props}>
        Manage Subscription
      </Button>
    </form>
  );
}
