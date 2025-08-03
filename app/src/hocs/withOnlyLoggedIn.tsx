import { sdkHooks } from '@/services/publicSdk';

export function withOnlyLoggedIn<Comp extends React.ComponentType<any>>(
  Component: Comp,
): Comp {
  return function OnlyLoggedIn(props) {
    const me = sdkHooks.useGetMe();
    if (!me.data) {
      return null; // or redirect to login page
    }
    return <Component {...props} />;
  } as Comp;
}
