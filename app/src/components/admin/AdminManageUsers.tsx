import { sdkHooks } from '@/services/publicSdk';
import { Box, Button, ConfirmedButton, DropdownMenu, Icon } from '@a-type/ui';

export interface AdminManageUsersProps {}

export function AdminManageUsers({}: AdminManageUsersProps) {
  const {
    data: { results, pageInfo },
    fetchNextPage,
  } = sdkHooks.useAdminGetUsers({});
  const deleteUser = sdkHooks.useAdminDeleteUser();
  const sendTestNotification = sdkHooks.useAdminSendTestNotification();

  return (
    <Box col gap>
      {results.map((user) => (
        <Box surface key={user.id} p border gap items="center">
          <Box col gap className="flex-1">
            <Box>{user.displayName}</Box>
            <Box>{user.email}</Box>
          </Box>
          <DropdownMenu>
            <DropdownMenu.Trigger render={<Button emphasis="ghost" />}>
              <Icon name="dots" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                onClick={() => sendTestNotification.mutate({ userId: user.id })}
              >
                Send Test Notification
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
          <ConfirmedButton
            color="attention"
            emphasis="primary"
            confirmText="Are you sure you want to delete this user?"
            onConfirm={async () => {
              return deleteUser.mutateAsync({ userId: user.id });
            }}
          >
            Delete
          </ConfirmedButton>
        </Box>
      ))}
      {pageInfo.hasNextPage && (
        <Box layout="center center" p full="width">
          <Button emphasis="ghost" onClick={() => fetchNextPage()}>
            Load more
          </Button>
        </Box>
      )}
    </Box>
  );
}
