import { registerPlugins } from '@module-federation/enhanced/runtime';
import { RetryPlugin } from '@module-federation/retry-plugin';

registerPlugins([
  RetryPlugin({
    retryTimes: 3,
    retryDelay: 300,
  }),
]);
