import { API_ORIGIN } from '@/config';
import { sdkHooks } from '@/services/publicSdk';
import { Button, ButtonProps } from '@a-type/ui';

export interface GoldUpgradeProps extends ButtonProps {}

export function GoldUpgrade({ className, ...props }: GoldUpgradeProps) {
  const { data: me } = sdkHooks.useGetMe();

  const isGold = me?.isGoldMember;
  if (isGold) {
    return null;
  }

  return (
    <form
      action={`${API_ORIGIN}/subscription/purchase`}
      method="post"
      className={className}
    >
      <Button type="submit" color="accent" {...props}>
        Upgrade to Gold
      </Button>
    </form>
  );
}
