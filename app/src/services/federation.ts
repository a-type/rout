import { registerPlugins } from '@module-federation/enhanced/runtime';
import { RetryPlugin } from '@module-federation/retry-plugin';

registerPlugins([
  RetryPlugin({
    fetch: {
      retryTimes: 3,
      retryDelay: 300,
    },
    script: {
      retryTimes: 3,
      retryDelay: 800,
    },
  }),
]);
