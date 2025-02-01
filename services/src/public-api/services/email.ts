import { Email } from '@a-type/auth';
import { SesEmailProvider } from '@a-type/auth-email-ses';
import { APP_NAME } from '@long-game/common';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';

export const email = new Email<Context<Env>>({
  provider: new SesEmailProvider({
    async getConnectionInfo(ctx) {
      return {
        accessKeyId: ctx.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: ctx.env.AWS_SECRET_ACCESS_KEY,
        region: 'us-east-1',
      };
    },
  }),

  async getConfig(ctx) {
    return {
      from: ctx.env.EMAIL_FROM,
      uiOrigin: ctx.env.UI_ORIGIN,
      appName: APP_NAME,
      emailHost: 'smtp.zoho.com',
      developerName: 'Grant',
    };
  },
});
