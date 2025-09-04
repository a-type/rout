import { PrefixedId } from '@long-game/common';
import { NotificationConfig } from './types.js';

export interface TestNotification {
  type: 'test';
  id: PrefixedId<'no'>;
}

export const testNotification: NotificationConfig<TestNotification> = {
  type: 'test',
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
