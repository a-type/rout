import { logger, LongGameError, PrefixedId } from '@long-game/common';
import {
  AnyNotification,
  getNotificationConfig,
} from '@long-game/notifications';
import { email } from './email.js';
import { sendPushToAllUserDevices } from './push.js';

export async function notifyUser(
  userId: PrefixedId<'u'>,
  notification: AnyNotification,
  bindings: ApiBindings,
) {
  const db = bindings.ADMIN_STORE;

  await db.insertNotification(userId, notification);
  const notificationSettings = await db.getUserNotificationSettings(userId);
  const { push: sendPush, email: sendEmail } =
    notification.type === 'test'
      ? { push: true, email: true }
      : notificationSettings[notification.type];

  if (sendPush) {
    logger.debug(`Sending push notification to user: ${userId}`);
    try {
      await sendPushToAllUserDevices(userId, notification, bindings);
    } catch (error) {
      logger.urgent(
        `Failed to send push notification to user ${userId}:`,
        error,
      );
      await db.addNotificationDeliveryFailure(
        notification.id,
        LongGameError.wrap(error).toLogsSync().join('\n'),
      );
      throw error;
    }
  }

  if (sendEmail) {
    logger.debug(`Sending email notification to user: ${userId}`);
    const config = getNotificationConfig(notification);
    const user = await db.getUser(userId);
    if (!user) {
      logger.warn(`User not found for ID: ${userId}`);
      return;
    }
    const text = config.text(notification, 'email');
    const link = config.link(notification);
    try {
      await email.sendCustomEmail(
        {
          to: user.email,
          subject: config.title(notification, 'email'),
          text: `${text}\n\n${link}\nCheers,\nThe Rout Team`,
          html: `<h1>${config.title(notification, 'email')}</h1>
			<p>${text}</p>
			<p><a href="${bindings.UI_ORIGIN}${link}">Click here to open Rout!</a></p>
			<p>Cheers,</p>
			<p>The Rout Team</p>`,
        },
        { env: bindings },
      );
    } catch (error) {
      logger.urgent(
        `Failed to send email notification to user ${userId}:`,
        error,
      );
      await db.addNotificationDeliveryFailure(
        notification.id,
        LongGameError.wrap(error).toLogsSync().join('\n'),
      );
      throw error;
    }
  }
}
