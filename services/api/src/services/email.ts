import { Email } from '@a-type/auth';
import { SesEmailProvider } from '@a-type/auth-email-ses';
import { APP_NAME, PrefixedId } from '@long-game/common';
import { Context } from 'hono';
import { Env } from '../config/ctx.js';

export const email = new Email<{ env: ApiBindings }>({
  provider: new SesEmailProvider({
    async getConnectionInfo(baseCtx) {
      const ctx = baseCtx as Context<Env>;
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
      developerName: 'Grant',
    };
  },
});

export function sendGameInvitationEmail(
  ctx: Context,
  data: {
    to: string;
    inviterName: string;
    userName: string;
    gameSessionId: PrefixedId<'gs'>;
  },
) {
  return email.sendCustomEmail(
    {
      to: data.to,
      subject: `${data.inviterName} has invited you to play a game!`,
      html: `<h1>Rout!</h1>
    <p>${data.inviterName} has invited you to join their game on Rout.</p>
    <p>Click <a href="${ctx.env.UI_ORIGIN}/session/${data.gameSessionId}">here</a> to join the game.</p>
    <p>Have fun!</p>
    <p>The Rout team</p>`,
      text: `${data.inviterName} has invited you to join their game on Rout. Use this link to join the game: ${ctx.env.UI_ORIGIN}/session/${data.gameSessionId}. \nHave fun! \nThe Rout team.`,
    },
    ctx,
  );
}

export function sendFriendshipInviteEmail(
  ctx: Context,
  data: {
    to: string;
    inviterName: string;
    inviteLink: string;
  },
) {
  return email.sendCustomEmail(
    {
      to: data.to,
      subject: `Play games with ${data.inviterName}`,
      text: `${data.inviterName} invited you to join them as a friend on ${APP_NAME}. Keep in touch in through a daily ritual of play!

        Visit ${data.inviteLink} to get started.`,
      html: `<p>${data.inviterName} invited you to join them as a friend on ${APP_NAME}. Keep in touch in through a daily ritual of play!</p>
          <p>Visit <a href="${data.inviteLink}">${data.inviteLink}</a> to get started.</p>`,
    },
    ctx,
  );
}
