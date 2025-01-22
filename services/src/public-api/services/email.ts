import { Email } from '@a-type/auth';
import { SesEmailProvider } from '@a-type/auth-email-ses';
import { APP_NAME } from '@long-game/common';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';

export const email = new Email<Context<Env>>({
  provider: new SesEmailProvider({
    async getConnectionInfo(ctx) {
      return {
        accessKeyId: 'TODO',
        secretAccessKey: 'TODO',
        region: 'us-east-2',
      };
    },
  }),

  async getConfig(ctx) {
    return {
      from: 'long-game@gfor.rest',
      uiOrigin: ctx.env.UI_ORIGIN,
      appName: APP_NAME,
      emailHost: 'smtp.zoho.com',
      developerName: 'Grant',
    };
  },
});
