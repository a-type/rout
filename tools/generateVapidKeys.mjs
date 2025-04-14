import fs from 'fs';
import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

// write to the end of .env
fs.appendFileSync(
  'vapidKeys.txt',
  `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`,
);

console.log('Keys written to vapidKeys.txt');
