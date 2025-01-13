import { Email } from '@a-type/auth';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';

export const email = new Email<Context<Env>>({
  async getConnectionInfo(ctx) {
    return {
      user: ctx.env.EMAIL_USER,
      pass: ctx.env.EMAIL_PASS,
      uiOrigin: ctx.env.UI_ORIGIN,
      appName: 'Long Game',
      emailHost: 'smtp.zoho.com',
      developerName: 'Grant',
    };
  },
});
