import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface TestNotification {
  type: 'test';
  id: PrefixedId<'no'>;
}

export const testNotification: NotificationConfig<TestNotification> = {
  type: 'test',
  name: 'Test notification',
  description: 'Internal test notification for verifying notification delivery.',
  text() {
    return `Test notification, please ignore`;
  },
  title() {
    return 'Test notification';
  },
  link() {
    return `/`;
  },
};
